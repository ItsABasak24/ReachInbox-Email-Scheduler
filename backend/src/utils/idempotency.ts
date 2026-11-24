import crypto from 'crypto';

/**
 * Generates a deterministic idempotency key based on userId, recipientEmail, subject, and campaignId.
 */
export function generateIdempotencyKey(
  userId: string,
  recipientEmail: string,
  subject: string,
  campaignId: string
): string {
  const normalizedData = `${userId.trim()}:${recipientEmail.trim().toLowerCase()}:${subject.trim()}:${campaignId.trim()}`;
  return crypto.createHash('sha256').update(normalizedData).digest('hex');
}

export default generateIdempotencyKey;
