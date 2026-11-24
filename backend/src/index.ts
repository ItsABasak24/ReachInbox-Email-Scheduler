import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load dotenv from backend/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { config } from './config';
import { db } from './db/connection';
import elasticsearchService from './services/elasticsearchService';
import smtpService from './services/smtpService';
import { emailQueue, recoverScheduledEmails, closeQueue } from './queues/emailQueue';
import { startWorker, closeWorker } from './queues/emailWorker';

import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import slackRoutes from './routes/slackRoutes';

const app = express();

// Standard middleware
app.use(
  cors({
    origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount Bull Board at /admin/queues
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static build in production if available
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log(`[Express] Serving static frontend from ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler for unknown routes (when not serving frontend or for missing API routes)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Not Found - ${req.method} ${req.originalUrl}` });
});

// Centralized error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Express] Uncaught server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

/**
 * Server startup bootstrap sequence
 */
async function bootstrap() {
  try {
    console.log('[App] Starting ReachInbox Email Job Scheduler backend...');

    // 1. Run Knex migrations
    console.log('[DB] Running database migrations...');
    try {
      await db.migrate.latest({
        directory: path.resolve(__dirname, './db/migrations'),
      });
      console.log('[DB] Migrations applied successfully.');
    } catch (dbErr: any) {
      console.warn('[DB] Migration notice (database might be initializing or offline):', dbErr?.message || dbErr);
    }

    // 2. Initialize Elasticsearch index
    console.log('[Elasticsearch] Initializing index...');
    await elasticsearchService.initIndex();

    // 3. Initialize SMTP service (auto-create Ethereal test account if needed)
    console.log('[SMTP] Initializing SMTP service...');
    await smtpService.initSmtp();

    // 4. Recover scheduled emails from DB to BullMQ
    console.log('[BullMQ] Recovering scheduled emails...');
    await recoverScheduledEmails();

    // 5. Start BullMQ worker
    console.log('[BullMQ] Starting worker...');
    startWorker();

    // 6. Listen on PORT
    const server = app.listen(config.PORT, () => {
      console.log(`[App] Server listening on port ${config.PORT}`);
      console.log(`[App] Bull Board UI available at http://localhost:${config.PORT}/admin/queues`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[App] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        try {
          console.log('[BullMQ] Closing email worker...');
          await closeWorker();
          console.log('[BullMQ] Closing email queue...');
          await closeQueue();
          console.log('[DB] Closing database connection...');
          await db.destroy();
          console.log('[App] Shutdown completed.');
          process.exit(0);
        } catch (error) {
          console.error('[App] Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[App] Bootstrap fatal error:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
