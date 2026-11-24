import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import slackService from '../services/slackService';
import UserModel from '../models/user';
import { config } from '../config';

const router = Router();

/**
 * GET /api/slack/connect
 * Redirects user to Slack OAuth consent screen
 */
router.get('/connect', authenticateToken, (req: Request, res: Response) => {
  const state = Buffer.from(
    JSON.stringify({ userId: req.user!.id, timestamp: Date.now() })
  ).toString('base64');

  const authorizeUrl = slackService.getOAuthUrl(state);
  res.redirect(authorizeUrl);
});

/**
 * GET /api/slack/callback
 * Exchanges Slack code for token and saves credentials on user record
 */
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code) {
    res.redirect(`${config.FRONTEND_URL}/settings?slack=error&message=Missing+code`);
    return;
  }

  try {
    let userId = req.user?.id;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        if (decoded.userId) {
          userId = decoded.userId;
        }
      } catch {
        if (!userId) {
          userId = state;
        }
      }
    }

    if (!userId) {
      res.redirect(`${config.FRONTEND_URL}/settings?slack=error&message=User+context+not+found`);
      return;
    }

    const oauthResponse = await slackService.exchangeCode(code);
    if (!oauthResponse.ok) {
      res.redirect(
        `${config.FRONTEND_URL}/settings?slack=error&message=${encodeURIComponent(oauthResponse.error || 'Slack authorization failed')}`
      );
      return;
    }

    await UserModel.updateSlackInfo(userId, {
      slack_access_token: oauthResponse.access_token || null,
      slack_webhook_url: oauthResponse.incoming_webhook?.url || null,
      slack_channel_id: oauthResponse.incoming_webhook?.channel_id || null,
    });

    res.redirect(`${config.FRONTEND_URL}/settings?slack=connected`);
  } catch (error: any) {
    console.error('[SlackRoutes] OAuth exchange error:', error);
    res.redirect(
      `${config.FRONTEND_URL}/settings?slack=error&message=${encodeURIComponent(error?.message || 'Connection failed')}`
    );
  }
});

/**
 * POST /api/slack/disconnect
 * Removes Slack credentials from current user
 */
router.post('/disconnect', authenticateToken, async (req: Request, res: Response) => {
  try {
    await UserModel.removeSlackInfo(req.user!.id);
    res.json({ success: true, message: 'Slack disconnected successfully' });
  } catch (error: any) {
    console.error('[SlackRoutes] Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Slack' });
  }
});

/**
 * GET /api/slack/status
 * Returns current Slack integration status
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.id);
    res.json({
      connected: Boolean(user?.slack_access_token),
      channelId: user?.slack_channel_id || undefined,
    });
  } catch (error: any) {
    console.error('[SlackRoutes] Status check error:', error);
    res.status(500).json({ error: 'Failed to fetch Slack status' });
  }
});

export default router;
