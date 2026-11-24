import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

let transporter: Transporter | null = null;
let testAccountCredentials: { user: string; pass: string; host: string; port: number } | null = null;

/**
 * Initializes the SMTP transporter.
 * If SMTP_HOST is not configured, automatically creates an Ethereal test account.
 */
export async function initSmtp(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
    console.log(`[SMTP] Configured with host: ${config.SMTP_HOST}:${config.SMTP_PORT}`);
  } else {
    console.log('[SMTP] No custom SMTP config found. Creating Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      testAccountCredentials = {
        user: testAccount.user,
        pass: testAccount.pass,
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
      };

      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('[SMTP] Ethereal test account created successfully:');
      console.log(`  User: ${testAccount.user}`);
      console.log(`  Pass: ${testAccount.pass}`);
      console.log('  Web:  https://ethereal.email/login');
    } catch (error) {
      console.error('[SMTP] Failed to create Ethereal test account:', error);
      // Fallback transporter to prevent complete crash
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

/**
 * Sends an email using the configured transporter.
 */
export async function sendEmail(
  from: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ messageId: string; previewUrl: string }> {
  if (!transporter) {
    await initSmtp();
  }

  const info = await transporter!.sendMail({
    from,
    to,
    subject,
    html: htmlBody,
    text: htmlBody.replace(/<[^>]+>/g, ''),
  });

  const preview = nodemailer.getTestMessageUrl(info);
  const previewUrl = preview ? preview.toString() : '';

  if (previewUrl) {
    console.log(`[SMTP] Email sent to ${to}. Preview URL: ${previewUrl}`);
  } else {
    console.log(`[SMTP] Email sent to ${to}. Message ID: ${info.messageId}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}

export function getTransporter(): Transporter | null {
  return transporter;
}

export function getCredentials() {
  return testAccountCredentials;
}

export default {
  initSmtp,
  sendEmail,
  getTransporter,
  getCredentials,
};
