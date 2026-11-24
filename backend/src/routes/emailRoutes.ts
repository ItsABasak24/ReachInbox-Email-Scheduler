import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import EmailModel, { Email, EmailStatus } from '../models/email';
import { generateIdempotencyKey } from '../utils/idempotency';
import { addBulkEmailJobs } from '../queues/emailQueue';
import elasticsearchService from '../services/elasticsearchService';

const router = Router();

// Apply authentication to all email routes
router.use(authenticateToken);

/**
 * POST /api/emails/schedule
 * Schedule batch email sending with delays and idempotency keys
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const {
      senderEmail,
      subject,
      body,
      recipients,
      startTime,
      delayBetweenEmails,
      hourlyLimit,
    } = req.body;

    if (!senderEmail || !subject || !body || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({
        error: 'Invalid request: senderEmail, subject, body, and non-empty recipients array are required.',
      });
      return;
    }

    const campaignId = uuidv4();
    const userId = req.user!.id;
    const baseStartTime = startTime ? new Date(startTime).getTime() : Date.now();

    // delayBetweenEmails can be specified in seconds or milliseconds
    const rawDelay = Number(delayBetweenEmails);
    const delayStepMs = !isNaN(rawDelay) && rawDelay > 0
      ? (rawDelay >= 1000 ? rawDelay : rawDelay * 1000)
      : 2000;

    const emailRecords: Partial<Email>[] = recipients.map((recipient: { email: string; name?: string }, index: number) => {
      const recipientEmail = recipient.email.trim();
      const scheduledAt = new Date(baseStartTime + index * delayStepMs);
      const idempotencyKey = generateIdempotencyKey(userId, recipientEmail, subject, campaignId);

      return {
        id: uuidv4(),
        user_id: userId,
        sender_email: senderEmail.trim(),
        recipient_email: recipientEmail,
        subject: subject.trim(),
        body,
        status: 'scheduled' as EmailStatus,
        scheduled_at: scheduledAt,
        idempotency_key: idempotencyKey,
        campaign_id: campaignId,
      };
    });

    // Bulk insert into PostgreSQL
    const createdEmails = await EmailModel.createBatch(emailRecords);

    // Queue jobs in BullMQ
    const now = Date.now();
    const queueJobs = createdEmails.map((email) => ({
      emailId: email.id,
      delay: Math.max(0, new Date(email.scheduled_at).getTime() - now),
    }));

    await addBulkEmailJobs(queueJobs);

    // Index created emails into Elasticsearch asynchronously
    for (const email of createdEmails) {
      elasticsearchService.indexEmail(email).catch((err) => {
        console.warn(`[EmailRoutes] Elasticsearch indexing failed for email ${email.id}:`, err?.message || err);
      });
    }

    res.status(201).json({
      campaignId,
      emailCount: createdEmails.length,
      scheduledEmails: createdEmails,
    });
  } catch (error: any) {
    console.error('[EmailRoutes] Error scheduling emails:', error);
    res.status(500).json({ error: error?.message || 'Failed to schedule emails' });
  }
});

/**
 * GET /api/emails/scheduled
 * Retrieve emails with 'scheduled' or 'processing' status
 */
router.get('/scheduled', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = req.query.search as string | undefined;

    const result = await EmailModel.findByUserId(req.user!.id, {
      status: ['scheduled', 'processing'],
      page,
      limit,
      search,
    });

    res.json(result);
  } catch (error: any) {
    console.error('[EmailRoutes] Error fetching scheduled emails:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
});

/**
 * GET /api/emails/sent
 * Retrieve emails with 'sent' or 'failed' status
 */
router.get('/sent', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = req.query.search as string | undefined;

    const result = await EmailModel.findByUserId(req.user!.id, {
      status: ['sent', 'failed'],
      page,
      limit,
      search,
    });

    res.json(result);
  } catch (error: any) {
    console.error('[EmailRoutes] Error fetching sent emails:', error);
    res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
});

/**
 * GET /api/emails/search
 * Full text search via Elasticsearch with database fallback
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);

    const esResult = await elasticsearchService.searchEmails(req.user!.id, q, {
      status,
      page,
      limit,
    });

    // If Elasticsearch had matches, return them
    if (esResult.emails.length > 0 || !q) {
      res.json(esResult);
      return;
    }

    // Fallback to database search if Elasticsearch returned 0 hits
    const dbResult = await EmailModel.findByUserId(req.user!.id, {
      status: status as EmailStatus | undefined,
      page,
      limit,
      search: q,
    });

    res.json(dbResult);
  } catch (error: any) {
    console.error('[EmailRoutes] Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

/**
 * GET /api/emails/:id
 * Retrieve single email by ID belonging to current user
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const email = await EmailModel.findById(req.params.id);
    if (!email || email.user_id !== req.user!.id) {
      res.status(404).json({ error: 'Email not found' });
      return;
    }

    res.json(email);
  } catch (error: any) {
    console.error('[EmailRoutes] Error fetching email by ID:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

export default router;
