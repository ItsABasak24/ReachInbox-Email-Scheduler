import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { Email } from '../models/email';

export const INDEX_NAME = 'emails';

export const esClient = new Client({
  node: config.ELASTICSEARCH_URL,
});

/**
 * Initialize Elasticsearch index with proper field mappings.
 */
export async function initIndex(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            subject: { type: 'text' },
            body: { type: 'text' },
            sender_email: { type: 'keyword' },
            recipient_email: { type: 'keyword' },
            status: { type: 'keyword' },
            user_id: { type: 'keyword' },
            campaign_id: { type: 'keyword' },
            scheduled_at: { type: 'date' },
            sent_at: { type: 'date' },
          },
        },
      });
      console.log(`[Elasticsearch] Index '${INDEX_NAME}' created successfully.`);
    } else {
      console.log(`[Elasticsearch] Index '${INDEX_NAME}' already exists.`);
    }
  } catch (err: any) {
    console.warn(`[Elasticsearch] Failed to initialize index '${INDEX_NAME}':`, err?.message || err);
  }
}

/**
 * Index or update an email document in Elasticsearch.
 */
export async function indexEmail(email: Partial<Email> & { id: string }): Promise<void> {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: email.id,
      document: {
        id: email.id,
        user_id: email.user_id,
        sender_email: email.sender_email,
        recipient_email: email.recipient_email,
        subject: email.subject,
        body: email.body,
        status: email.status,
        campaign_id: email.campaign_id,
        scheduled_at: email.scheduled_at,
        sent_at: email.sent_at,
      },
    });
  } catch (err: any) {
    console.warn(`[Elasticsearch] Failed to index email ${email.id}:`, err?.message || err);
  }
}

export interface SearchFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  emails: any[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Full-text search for emails with optional status and pagination filters.
 */
export async function searchEmails(
  userId: string,
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResult> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, filters.limit || 20);
  const from = (page - 1) * limit;

  try {
    const mustClauses: any[] = [
      { term: { user_id: userId } },
    ];

    if (query && query.trim().length > 0) {
      mustClauses.push({
        multi_match: {
          query: query.trim(),
          fields: ['subject^3', 'body', 'recipient_email^2', 'sender_email'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (filters.status) {
      mustClauses.push({ term: { status: filters.status } });
    }

    const response = await esClient.search({
      index: INDEX_NAME,
      from,
      size: limit,
      query: {
        bool: {
          must: mustClauses,
        },
      },
      sort: [
        { scheduled_at: { order: 'desc' } },
      ],
    });

    const hits = response.hits.hits || [];
    const totalCount = typeof response.hits.total === 'number'
      ? response.hits.total
      : (response.hits.total?.value || 0);

    const emails = hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as Record<string, any>),
    }));

    return {
      emails,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  } catch (err: any) {
    console.warn('[Elasticsearch] Search query failed, falling back:', err?.message || err);
    return {
      emails: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }
}

export default {
  INDEX_NAME,
  esClient,
  initIndex,
  indexEmail,
  searchEmails,
};
