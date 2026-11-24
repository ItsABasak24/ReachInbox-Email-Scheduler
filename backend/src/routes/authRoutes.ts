import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import UserModel from '../models/user';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const oauth2Client = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen
 */
router.get('/google', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ],
    prompt: 'consent',
  });
  res.redirect(url);
});

/**
 * GET /api/auth/google/callback
 * Handle OAuth callback from Google
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).redirect(`${config.FRONTEND_URL}/login?error=Missing+authorization+code`);
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let googleId = '';
    let email = '';
    let name = '';
    let avatarUrl = '';

    if (tokens.id_token) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: config.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload) {
          googleId = payload.sub;
          email = payload.email || '';
          name = payload.name || payload.email || 'User';
          avatarUrl = payload.picture || '';
        }
      } catch (verifyErr) {
        console.warn('[AuthRoutes] ID token verification failed, falling back to userinfo api:', verifyErr);
      }
    }

    if (!googleId || !email) {
      const userInfoResponse = await oauth2Client.request<{
        id?: string;
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
      }>({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      });
      const data = userInfoResponse.data;
      googleId = googleId || data.id || data.sub || '';
      email = email || data.email || '';
      name = name || data.name || email;
      avatarUrl = avatarUrl || data.picture || '';
    }

    if (!googleId || !email) {
      res.status(400).redirect(`${config.FRONTEND_URL}/login?error=Failed+to+retrieve+user+profile`);
      return;
    }

    const user = await UserModel.upsertByGoogleId({
      google_id: googleId,
      email,
      name,
      avatar_url: avatarUrl,
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${config.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err: any) {
    console.error('[AuthRoutes] Google OAuth callback error:', err?.message || err);
    res.redirect(`${config.FRONTEND_URL}/login?error=OAuth+authentication+failed`);
  }
});

/**
 * GET /api/auth/me
 * Protected route, returns currently logged in user info
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      slack_connected: Boolean(user.slack_access_token),
      slack_channel_id: user.slack_channel_id,
      created_at: user.created_at,
    });
  } catch (error: any) {
    console.error('[AuthRoutes] /me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
