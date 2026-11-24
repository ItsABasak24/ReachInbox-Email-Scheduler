import { WebClient } from '@slack/web-api';
import { config } from '../config';
import UserModel from '../models/user';

/**
 * Sends a Slack notification when a sender's hourly rate limit is hit.
 * If user has not connected Slack, fails silently without throwing.
 */
export async function notifyRateLimit(
  userId: string,
  senderEmail: string,
  currentCount: number,
  limit: number
): Promise<void> {
  try {
    const user = await UserModel.findById(userId);
    if (!user || !user.slack_access_token) {
      return;
    }

    const client = new WebClient(user.slack_access_token);
    const message = `⚠️ Rate limit reached for sender ${senderEmail}: ${currentCount}/${limit} emails/hour. Excess emails will be delayed to the next hour.`;

    if (user.slack_channel_id) {
      await client.chat.postMessage({
        channel: user.slack_channel_id,
        text: message,
      });
      console.log(`[SlackService] Rate limit notification sent to Slack channel ${user.slack_channel_id} for user ${userId}`);
    }
  } catch (error: any) {
    console.warn(`[SlackService] Failed to send rate limit notification for user ${userId}:`, error?.message || error);
  }
}

/**
 * Builds the Slack OAuth v2 authorize URL.
 */
export function getOAuthUrl(state: string): string {
  const scopes = 'chat:write,incoming-webhook';
  const params = new URLSearchParams({
    client_id: config.SLACK_CLIENT_ID,
    scope: scopes,
    redirect_uri: config.SLACK_REDIRECT_URI,
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchanges the Slack authorization code for an access token.
 */
export async function exchangeCode(code: string): Promise<any> {
  const client = new WebClient();
  const response = await client.oauth.v2.access({
    client_id: config.SLACK_CLIENT_ID,
    client_secret: config.SLACK_CLIENT_SECRET,
    code,
    redirect_uri: config.SLACK_REDIRECT_URI,
  });

  return response;
}

export default {
  notifyRateLimit,
  getOAuthUrl,
  exchangeCode,
};
