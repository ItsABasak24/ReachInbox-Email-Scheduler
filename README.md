# 🚀 ReachInbox Email Job Scheduler & Dashboard

A production-grade, distributed email scheduling service and real-time dashboard built for the ReachInbox hiring assignment. Built with **TypeScript**, **Express.js**, **BullMQ**, **Redis**, **PostgreSQL**, **Elasticsearch**, and a **React (Vite + Tailwind CSS)** frontend.

---

## 📑 Table of Contents

1. [Features Implemented (Requirement Mapping)](#-features-implemented)
2. [Architecture Overview](#-architecture-overview)
   - [How Scheduling Works (No Cron)](#1-how-scheduling-works-no-cron)
   - [Persistence Across Restarts & Idempotency](#2-persistence-across-restarts--idempotency)
   - [Rate Limiting, Delays & Concurrency](#3-rate-limiting-delays--concurrency)
3. [Environment Variables & Ethereal SMTP Setup](#-environment-variables--ethereal-smtp-setup)
4. [Step-by-Step Setup & How to Run](#-step-by-step-setup--how-to-run)
   - [Step 1: Start Infrastructure (Docker)](#step-1-start-infrastructure-docker)
   - [Step 2: Run Backend](#step-2-run-backend)
   - [Step 3: Run Frontend](#step-3-run-frontend)
5. [Testing & Verification Guide](#-testing--verification-guide)
6. [API Endpoints Reference](#-api-endpoints-reference)

---

## 🌟 Features Implemented

### 🖥 Backend Features
| Requirement | Implementation Detail | Status |
|---|---|---|
| **Core Scheduler** | Express.js + BullMQ delayed jobs backed by Redis (Strictly **no cron jobs**). | ✅ Complete |
| **Relational Storage** | PostgreSQL with Knex.js query builder, migrations, indexes, and UUID keys. | ✅ Complete |
| **Persistence on Restart** | Recovers scheduled emails from DB on server startup without losing or duplicating jobs. | ✅ Complete |
| **Idempotency** | Job deduplication via deterministic SHA-256 idempotency keys + email status checks. | ✅ Complete |
| **Multi-Sender Support** | Dynamic sender support with individual hourly quota tracking per sender. | ✅ Complete |
| **Worker Concurrency** | Configurable worker concurrency (`WORKER_CONCURRENCY=5`) for parallel sends. | ✅ Complete |
| **Throttling & Pacing Delay** | Minimum enforced pause between individual email sends (`MIN_DELAY_BETWEEN_EMAILS_MS=2000`). | ✅ Complete |
| **Hourly Rate Limiter** | Redis atomic sliding window counters (`INCR` + `EXPIRE 3600`). Excess jobs delayed to next hour. | ✅ Complete |
| **Slack Notifications** | Real OAuth 2.0 flow; notifies user's Slack channel instantly upon hitting sender rate limits. | ✅ Complete |
| **Elasticsearch Search** | Elasticsearch 8 indexing on schedule & send, with fuzzy full-text search and DB fallback. | ✅ Complete |
| **Fake SMTP (Ethereal)** | Nodemailer with automatic Ethereal account creation and web preview URL logging. | ✅ Complete |
| **Queue Monitoring** | Bull Board mounted at `/admin/queues` for real-time visual inspection of queues. | ✅ Complete |

### 🎨 Frontend Features
| Requirement | Implementation Detail | Status |
|---|---|---|
| **Google OAuth Login** | Real Google OAuth 2.0 sign-in flow with token management and protected routes. | ✅ Complete |
| **User Profile Header** | Displays Google user's name, email, avatar, connection badges, and logout. | ✅ Complete |
| **Main Dashboard** | Modern dark-themed layout matching Outbox design system with sidebar and tabbed interface. | ✅ Complete |
| **Compose New Email** | Modal supporting sender email, subject, HTML/plain text body, and scheduling controls. | ✅ Complete |
| **CSV / TXT Lead Uploader** | Drag-and-drop file upload with client-side email parsing and detected address counter/preview. | ✅ Complete |
| **Custom Scheduling Pacing** | UI controls for start date/time, delay between emails (seconds), and hourly limits. | ✅ Complete |
| **Scheduled Emails Table** | Live table showing recipient, subject, scheduled time, and status badge with 10s auto-refresh. | ✅ Complete |
| **Sent Emails Table** | Table of sent/failed emails with direct clickable links to **Ethereal Email Web Previews**. | ✅ Complete |
| **Elasticsearch Search Bar** | Real-time search across subject, body, and recipient emails. | ✅ Complete |
| **Slack Connection Widget** | One-click Slack OAuth connect/disconnect widget with live status indicator. | ✅ Complete |
| **UI Components & UX** | Reusable buttons, modals, badges, skeletons, toast alerts (`react-hot-toast`), and empty states. | ✅ Complete |

---

## 🏛 Architecture Overview

```
                        ┌──────────────────────────────────────────────────┐
                        │              React Frontend (Vite)               │
                        │  - Google Auth  - Compose Modal  - Live Tables   │
                        └─────────────────────────┬────────────────────────┘
                                                  │ HTTP / REST API (JWT)
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Express.js Backend Service                                     │
│                                                                                                  │
│   ┌─────────────────────┐    ┌────────────────────────┐    ┌─────────────────────────────────┐   │
│   │  Auth Routes (JWT)  │    │  Email Schedule API    │    │  Slack OAuth & Alerts           │   │
│   └─────────────────────┘    └───────────┬────────────┘    └─────────────────────────────────┘   │
│                                          │                                                       │
│                   ┌──────────────────────┴──────────────────────┐                                │
│                   ▼                                             ▼                                │
│        ┌─────────────────────┐                       ┌─────────────────────┐                     │
│        │ PostgreSQL Storage  │                       │ BullMQ Delayed Queue│                     │
│        │ (Source of Truth)   │                       │ (Redis-backed)      │                     │
│        └─────────────────────┘                       └──────────┬──────────┘                     │
│                                                                 │                                │
│                                                                 ▼                                │
│                                                      ┌─────────────────────┐                     │
│                                                      │    BullMQ Worker    │                     │
│                                                      │  - Concurrency (5)  │                     │
│                                                      │  - 2s Pacing Delay  │                     │
│                                                      │  - Redis Rate Limit │                     │
│                                                      └──────────┬──────────┘                     │
└─────────────────────────────────────────────────────────────────┼────────────────────────────────┘
                                                                  │
                                      ┌───────────────────────────┼───────────────────────────┐
                                      ▼                           ▼                           ▼
                           ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
                           │    Ethereal SMTP    │     │    Elasticsearch    │     │   Slack Web API     │
                           │   (Email Delivery)  │     │   (Full-Text Index) │     │ (Rate Limit Alerts) │
                           └─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### 1. How Scheduling Works (No Cron)
- **Zero Cron**: No OS-level cron (`crontab`) or node libraries (`node-cron`, `agenda`) are used.
- When an email batch is scheduled via the UI or API:
  1. Records are inserted into PostgreSQL with `status = 'scheduled'` and calculated `scheduled_at` timestamps:
     $$\text{scheduled\_at}_i = \text{startTime} + (i \times \text{delayBetweenEmails})$$
  2. For each email, a delayed job is pushed to the BullMQ `email-send` queue with:
     $$\text{delay} = \max(0, \text{scheduled\_at} - \text{Date.now()})$$
  3. BullMQ registers delayed jobs in Redis sorted sets. Redis handles the internal timers with millisecond precision.
  4. When the scheduled time elapses, BullMQ automatically promotes the job to the active state for workers to process.

### 2. Persistence Across Restarts & Idempotency
- **Surviving Restarts**:
  - Redis runs with Append-Only File (`appendonly yes`) persistence enabled via Docker volume.
  - PostgreSQL stores all emails permanently with their intended `scheduled_at` timestamp.
  - **Auto-Recovery on Bootstrap**: Whenever the backend starts up, `recoverScheduledEmails()` executes:
    - Queries PostgreSQL for all emails where `status = 'scheduled'`.
    - Checks whether a job with `jobId = email.id` is currently present in BullMQ.
    - If absent, re-enqueues the job with remaining delay $\max(0, \text{scheduled\_at} - \text{now})$.
- **Strict Idempotency**:
  - `jobId` in BullMQ is set to `email.id` (UUID), preventing duplicate queue entries.
  - Each email has a unique `idempotency_key` in PostgreSQL generated as:
    $$\text{SHA-256}(\text{userId} + \text{recipientEmail} + \text{subject} + \text{campaignId})$$
  - The worker checks PostgreSQL status before sending: if `email.status === 'sent'`, the job is skipped immediately.

### 3. Rate Limiting, Delays & Concurrency
- **Worker Concurrency**:
  - Workers run with configurable concurrency (default `5` parallel jobs).
- **Minimum Delay Between Sends**:
  - Each worker enforces an explicit async pause (`MIN_DELAY_BETWEEN_EMAILS_MS`, default `2000ms`) to simulate provider throttling and prevent IP flagging.
- **Per-Sender Hourly Rate Limiting**:
  - Tracked in Redis via atomic counters keyed by hour window and sender:
    $$\text{Key: } \texttt{rate:sender:\{senderEmail\}:\{hourWindow\}}$$
  - Atomically incremented using Redis `MULTI` / `EXEC` with a 3600-second TTL.
  - If count exceeds `MAX_EMAILS_PER_HOUR_PER_SENDER`:
    1. The job is **not dropped or marked failed**.
    2. The job is rescheduled with a calculated delay to the beginning of the next hour window:
       $$\text{retryAfterMs} = (\text{nextHourTimestamp} - \text{now})$$
    3. If the user has connected Slack, an automated notification is sent to their Slack workspace.

---

## ⚙️ Environment Variables & Ethereal SMTP Setup

### Setting up Ethereal Email (Fake SMTP)
**You don't need to manually configure anything for Ethereal!**
- The backend has an **automatic bootstrap feature**: if `SMTP_HOST` or `SMTP_USER` is empty, it automatically calls `nodemailer.createTestAccount()` on startup.
- The credentials are created on the fly and logged to the console:
  ```text
  [SMTP] Creating dynamic Ethereal test account...
  [SMTP] Ethereal SMTP account created:
         User: your_user@ethereal.email
         Web:  https://ethereal.email
  ```
- After an email is sent, an Ethereal preview link is saved to the database and displayed as a clickable link in the frontend's **Sent Emails** tab!

### `.env` File Reference
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://outbox:outbox_password@localhost:5432/outbox_db` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `ELASTICSEARCH_URL` | Elasticsearch connection URL | `http://localhost:9200` |
| `JWT_SECRET` | Secret key for signing JWTs | `outbox-email-scheduler-secret-key-2026` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID | *(From Google Cloud Console)* |
| `GOOGLE_CLIENT_SECRET`| Google OAuth 2.0 Client Secret | *(From Google Cloud Console)* |
| `GOOGLE_REDIRECT_URI` | Google OAuth Callback URL | `http://localhost:3001/api/auth/google/callback` |
| `SLACK_CLIENT_ID` | Slack App Client ID | *(From api.slack.com/apps)* |
| `SLACK_CLIENT_SECRET` | Slack App Client Secret | *(From api.slack.com/apps)* |
| `SLACK_REDIRECT_URI` | Slack OAuth Callback URL | `http://localhost:3001/api/slack/callback` |
| `WORKER_CONCURRENCY` | Concurrent jobs in worker | `5` |
| `MIN_DELAY_BETWEEN_EMAILS_MS` | Delay between consecutive sends | `2000` (2 seconds) |
| `MAX_EMAILS_PER_HOUR` | Global hourly rate limit | `200` |
| `MAX_EMAILS_PER_HOUR_PER_SENDER`| Hourly rate limit per sender | `50` |
| `SMTP_HOST` | Custom SMTP Host *(leave empty for auto-Ethereal)*| `""` |
| `SMTP_PORT` | Custom SMTP Port | `587` |
| `SMTP_USER` | Custom SMTP Username | `""` |
| `SMTP_PASS` | Custom SMTP Password | `""` |

---

## 🚀 Step-by-Step Setup & How to Run

### Step 1: Start Infrastructure (Docker)
Ensure Docker Desktop is running, then run:
```bash
# In the project root directory
docker-compose up -d
```
This spins up:
- **PostgreSQL 15** on port `5432`
- **Redis 7** on port `6379`
- **Elasticsearch 8.12** on port `9200`

Verify all 3 containers are healthy:
```bash
docker-compose ps
```

---

### Step 2: Run Backend
```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Run database migrations & start development server
npm run dev
```
The backend will:
1. Run Knex migrations to create `users` and `emails` tables.
2. Ensure the `emails` Elasticsearch index and mappings exist.
3. Auto-generate or connect to Ethereal SMTP.
4. Scan and recover pending jobs in BullMQ.
5. Launch the BullMQ worker.
6. Serve API at **`http://localhost:3001`**.
7. Serve Bull Board UI at **`http://localhost:3001/admin/queues`**.

---

### Step 3: Run Frontend
In a new terminal:
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
The frontend is now accessible at **`http://localhost:5173`**.

---

## 🧪 Testing & Verification Guide

### 1. Google Login
1. Open `http://localhost:5173`.
2. Click **"Sign in with Google"**.
3. Complete the Google OAuth consent screen.
4. You are redirected to `/dashboard` with your user profile (avatar, name, email) shown in the top header.

### 2. Schedule New Emails (CSV Upload)
1. Click **"+ Compose Email"**.
2. Enter sender email, subject, and body.
3. Drag & drop [`sample_leads.csv`](file:///c:/D%20drive/Documents/Mission%20Placement%202026/Outbox/sample_leads.csv) (provided in the root directory).
4. Notice the badge displays: `10 email addresses detected`.
5. Set start time 1 minute into the future, delay to `2` seconds, and click **"Schedule Campaign"**.
6. Switch to the **Scheduled** tab to see all 10 emails queued.

### 3. Observe Delivery & Fake SMTP Previews
1. Watch the dashboard: every 10 seconds the table auto-refreshes.
2. When the time arrives, emails transition to the **Sent** tab with `sent` status.
3. Click **"View Preview"** on any sent email row to open the Ethereal web inbox and inspect the rendered email!

### 4. Test Server Restart Persistence
1. Schedule a batch 3 minutes into the future.
2. Confirm the emails appear in the **Scheduled** tab.
3. Stop the backend server (`Ctrl + C` in the backend terminal).
4. Wait 15–30 seconds while the server is offline.
5. Start the backend again (`npm run dev`).
6. Observe the log line: `[EmailQueue] Recovered and enqueued X scheduled jobs.`
7. When the scheduled time arrives, the worker sends all emails punctually without duplicate sends or lost jobs.

### 5. Test Rate Limiting & Slack Alert
1. In `.env`, temporarily set:
   ```env
   MAX_EMAILS_PER_HOUR_PER_SENDER=3
   ```
2. Restart backend: `npm run dev`.
3. In dashboard header, click **"Connect Slack"** to connect your workspace.
4. Schedule 6 emails starting now with `delay: 0`.
5. The first 3 send immediately; the remaining 3 are deferred to the next hour window.
6. A live Slack notification is dispatched to your connected channel:
   > ⚠️ *Rate limit reached for sender user@example.com: 4/3 emails/hour. Excess emails will be delayed to the next hour.*

---

## 📡 API Endpoints Reference

### Authentication
- `GET /api/auth/google` – Initiates Google OAuth 2.0 flow
- `GET /api/auth/google/callback` – Google OAuth callback & JWT issuance
- `GET /api/auth/me` – Returns authenticated user details (Protected)
- `POST /api/auth/logout` – Clears authentication

### Email Management
- `POST /api/emails/schedule` – Batch schedule emails with pacing & rate limits
- `GET /api/emails/scheduled` – Paginated list of scheduled/processing emails
- `GET /api/emails/sent` – Paginated list of sent/failed emails with Ethereal URLs
- `GET /api/emails/search?q={query}` – Elasticsearch full-text search across emails
- `GET /api/emails/:id` – Fetch single email details

### Slack Integration
- `GET /api/slack/connect` – Initiates Slack OAuth flow
- `GET /api/slack/callback` – Slack OAuth callback & token storage
- `GET /api/slack/status` – Check Slack connection state
- `POST /api/slack/disconnect` – Disconnect Slack notifications

### Queue Visibility
- `GET /admin/queues` – Real-time Bull Board queue dashboard
- `GET /health` – Server health status check

---

## 📄 License
MIT
