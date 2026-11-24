import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';
import EmailModel from '../models/email';
import { checkAndIncrementSenderRate } from './rateLimiter';
import { addEmailJob, QUEUE_NAME } from './emailQueue';
import smtpService from '../services/smtpService';
import elasticsearchService from '../services/elasticsearchService';
import slackService from '../services/slackService';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const workerRedisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export let worker: Worker | null = null;

/**
 * Worker job processing logic.
 */
export async function processEmailJob(job: Job): Promise<void> {
  const { emailId } = job.data;
  if (!emailId) {
    console.warn(`[EmailWorker] Job ${job.id} has no emailId, skipping.`);
    return;
  }

  // 1. Fetch email from DB
  const email = await EmailModel.findById(emailId);
  if (!email) {
    console.warn(`[EmailWorker] Email with ID ${emailId} not found in DB.`);
    return;
  }

  // 2. If email.status === 'sent', skip (idempotency)
  if (email.status === 'sent') {
    console.log(`[EmailWorker] Email ${emailId} is already sent, skipping.`);
    return;
  }

  // 3. Update status to 'processing'
  await EmailModel.updateStatus(email.id, 'processing');

  // 4. Check per-sender rate limit
  const rateLimit = await checkAndIncrementSenderRate(
    workerRedisConnection,
    email.sender_email,
    config.MAX_EMAILS_PER_HOUR_PER_SENDER
  );

  // 5. If not allowed, notify Slack, re-queue, and reset status
  if (!rateLimit.allowed) {
    console.warn(
      `[EmailWorker] Sender ${email.sender_email} exceeded hourly limit (${rateLimit.currentCount}/${config.MAX_EMAILS_PER_HOUR_PER_SENDER}). Delaying for ${rateLimit.retryAfterMs}ms.`
    );

    await slackService.notifyRateLimit(
      email.user_id,
      email.sender_email,
      rateLimit.currentCount,
      config.MAX_EMAILS_PER_HOUR_PER_SENDER
    );

    await addEmailJob(email.id, rateLimit.retryAfterMs);
    await EmailModel.updateStatus(email.id, 'scheduled');
    return;
  }

  // 6. Add minimum delay between emails
  if (config.MIN_DELAY_BETWEEN_EMAILS_MS > 0) {
    await sleep(config.MIN_DELAY_BETWEEN_EMAILS_MS);
  }

  // 7. Send email via SMTP service
  const sendResult = await smtpService.sendEmail(
    email.sender_email,
    email.recipient_email,
    email.subject,
    email.body
  );

  // 8. Update DB: status='sent', sent_at=now, ethereal_url=previewUrl
  const updatedEmail = await EmailModel.updateStatus(email.id, 'sent', {
    sent_at: new Date(),
    ethereal_url: sendResult.previewUrl || null,
  });

  // 9. Index to Elasticsearch
  if (updatedEmail) {
    await elasticsearchService.indexEmail(updatedEmail);
  }

  console.log(`[EmailWorker] Email ${email.id} successfully sent to ${email.recipient_email}.`);
}

/**
 * Initializes and starts the BullMQ Worker.
 */
export function startWorker(): Worker {
  if (worker) {
    return worker;
  }

  worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      await processEmailJob(job);
    },
    {
      connection: workerRedisConnection,
      concurrency: config.WORKER_CONCURRENCY,
      limiter: {
        max: config.MAX_EMAILS_PER_HOUR,
        duration: 3_600_000,
      },
    }
  );

  worker.on('completed', (job: Job) => {
    console.log(`[EmailWorker] Job ${job.id} completed.`);
  });

  worker.on('failed', async (job: Job | undefined, err: Error) => {
    console.error(`[EmailWorker] Job ${job?.id} failed with error:`, err.message);

    if (job?.data?.emailId) {
      try {
        const failedEmail = await EmailModel.updateStatus(job.data.emailId, 'failed', {
          error_message: err.message,
        });
        if (failedEmail) {
          await elasticsearchService.indexEmail(failedEmail);
        }
      } catch (dbError) {
        console.error(`[EmailWorker] Failed to update status to failed for email ${job.data.emailId}:`, dbError);
      }
    }
  });

  console.log(`[EmailWorker] Worker started for queue '${QUEUE_NAME}' with concurrency ${config.WORKER_CONCURRENCY}.`);
  return worker;
}

export async function closeWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await workerRedisConnection.quit();
}

export default {
  startWorker,
  closeWorker,
  processEmailJob,
};
