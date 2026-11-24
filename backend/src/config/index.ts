import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env or root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface AppConfig {
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  ELASTICSEARCH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_REDIRECT_URI: string;
  JWT_SECRET: string;
  WORKER_CONCURRENCY: number;
  MIN_DELAY_BETWEEN_EMAILS_MS: number;
  MAX_EMAILS_PER_HOUR: number;
  MAX_EMAILS_PER_HOUR_PER_SENDER: number;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  FRONTEND_URL: string;
}

export const config: AppConfig = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://outbox:outbox_password@localhost:5432/outbox_db',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID || '',
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || '',
  SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/slack/callback',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  MIN_DELAY_BETWEEN_EMAILS_MS: parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS_MS || '2000', 10),
  MAX_EMAILS_PER_HOUR: parseInt(process.env.MAX_EMAILS_PER_HOUR || '200', 10),
  MAX_EMAILS_PER_HOUR_PER_SENDER: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '50', 10),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default config;
