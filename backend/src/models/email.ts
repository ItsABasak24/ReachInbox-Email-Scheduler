import { db } from '../db/connection';

export type EmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed';

export interface Email {
  id: string;
  user_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduled_at: Date;
  sent_at?: Date | null;
  bullmq_job_id?: string | null;
  idempotency_key: string;
  campaign_id?: string | null;
  error_message?: string | null;
  ethereal_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FindEmailFilters {
  status?: EmailStatus | EmailStatus[];
  page?: number;
  limit?: number;
  search?: string;
}

export interface EmailPaginatedResult {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const EmailModel = {
  async findById(id: string): Promise<Email | undefined> {
    return db<Email>('emails').where({ id }).first();
  },

  async findByUserId(userId: string, filters: FindEmailFilters = {}): Promise<EmailPaginatedResult> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 20);
    const offset = (page - 1) * limit;

    let query = db<Email>('emails').where({ user_id: userId });

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.whereIn('status', filters.status);
      } else {
        query = query.where('status', filters.status);
      }
    }

    if (filters.search) {
      const s = `%${filters.search}%`;
      query = query.andWhere((builder) => {
        builder
          .where('subject', 'ilike', s)
          .orWhere('recipient_email', 'ilike', s)
          .orWhere('sender_email', 'ilike', s);
      });
    }

    const countQuery = query.clone().count<{ count: string | number }>('* as count').first();
    const emailsQuery = query.clone().orderBy('created_at', 'desc').limit(limit).offset(offset);

    const [countResult, emails] = await Promise.all([countQuery, emailsQuery]);
    const total = Number(countResult?.count || 0);

    return {
      emails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async findScheduledEmails(): Promise<Email[]> {
    return db<Email>('emails')
      .where('status', 'scheduled')
      .orderBy('scheduled_at', 'asc');
  },

  async create(emailData: Partial<Email>): Promise<Email> {
    const [email] = await db<Email>('emails').insert(emailData).returning('*');
    return email;
  },

  async createBatch(emailDataArray: Partial<Email>[]): Promise<Email[]> {
    if (emailDataArray.length === 0) return [];
    return db<Email>('emails').insert(emailDataArray).returning('*');
  },

  async updateStatus(id: string, status: EmailStatus, extraData?: Partial<Email>): Promise<Email | undefined> {
    const [updated] = await db<Email>('emails')
      .where({ id })
      .update({
        status,
        ...extraData,
        updated_at: new Date(),
      })
      .returning('*');
    return updated;
  },

  async findByCampaignId(campaignId: string): Promise<Email[]> {
    return db<Email>('emails').where({ campaign_id: campaignId }).orderBy('scheduled_at', 'asc');
  },
};

export default EmailModel;
