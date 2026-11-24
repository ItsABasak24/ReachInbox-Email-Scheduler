import Redis from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  currentCount: number;
}

/**
 * Checks and increments the hourly rate limit counter for a specific sender email.
 * Uses a Redis sliding-window hourly key.
 */
export async function checkAndIncrementSenderRate(
  redisClient: Redis,
  senderEmail: string,
  maxPerHour: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const currentHour = Math.floor(now / 3600000);
  const key = `rate:sender:${senderEmail}:${currentHour}`;

  const results = await redisClient
    .multi()
    .incr(key)
    .expire(key, 3600)
    .exec();

  const count = results && results[0] && results[0][1] ? Number(results[0][1]) : 1;

  if (count > maxPerHour) {
    const nextHour = (currentHour + 1) * 3600000;
    const retryAfterMs = Math.max(1000, nextHour - now);

    return {
      allowed: false,
      retryAfterMs,
      currentCount: count,
    };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
    currentCount: count,
  };
}

/**
 * Gets the current email count for a sender in the current hour window.
 */
export async function getSenderCount(redisClient: Redis, senderEmail: string): Promise<number> {
  const currentHour = Math.floor(Date.now() / 3600000);
  const key = `rate:sender:${senderEmail}:${currentHour}`;
  const count = await redisClient.get(key);
  return count ? parseInt(count, 10) : 0;
}

export default {
  checkAndIncrementSenderRate,
  getSenderCount,
};
