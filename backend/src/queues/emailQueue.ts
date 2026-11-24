import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';
import EmailModel from '../models/email';

export const redisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: config.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
});

export const QUEUE_NAME = 'email-send';

export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

/**
 * Adds an email sending job with a specific delay and emailId as jobId.
 */
export async function addEmailJob(emailId: string, delay: number = 0): Promise<Job> {
  const safeDelay = Math.max(0, delay);
  return emailQueue.add(
    'send-email',
    { emailId },
    {
      jobId: emailId,
      delay: safeDelay,
    }
  );
}

export interface BulkEmailJobInput {
  emailId: string;
  delay?: number;
}

/**
 * Bulk enqueue multiple email sending jobs.
 */
export async function addBulkEmailJobs(emails: BulkEmailJobInput[]): Promise<Job[]> {
  const jobs = emails.map((item) => ({
    name: 'send-email',
    data: { emailId: item.emailId },
    opts: {
      jobId: item.emailId,
      delay: Math.max(0, item.delay || 0),
    },
  }));
  return emailQueue.addBulk(jobs);
}

/**
 * Recovers scheduled emails from PostgreSQL to BullMQ upon server startup.
 */
export async function recoverScheduledEmails(): Promise<void> {
  try {
    const scheduledEmails = await EmailModel.findScheduledEmails();
    console.log(`[EmailQueue] Found ${scheduledEmails.length} scheduled emails to verify in BullMQ.`);

    const now = Date.now();
    let readdedCount = 0;

    for (const email of scheduledEmails) {
      try {
        const existingJob = await emailQueue.getJob(email.id);
        if (!existingJob) {
          const scheduledTime = new Date(email.scheduled_at).getTime();
          const delay = Math.max(0, scheduledTime - now);
          await addEmailJob(email.id, delay);
          readdedCount++;
        }
      } catch (err: any) {
        // Job might already exist or conflict, skip silently
        console.warn(`[EmailQueue] Skip recovering email ${email.id}:`, err?.message || err);
      }
    }

    console.log(`[EmailQueue] Recovered and enqueued ${readdedCount} scheduled jobs.`);
  } catch (error) {
    console.error('[EmailQueue] Error recovering scheduled emails:', error);
  }
}

export async function closeQueue(): Promise<void> {
  await emailQueue.close();
  await redisConnection.quit();
}

export default {
  emailQueue,
  redisConnection,
  addEmailJob,
  addBulkEmailJobs,
  recoverScheduledEmails,
  closeQueue,
};
