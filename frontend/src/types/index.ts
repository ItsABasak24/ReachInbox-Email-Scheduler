export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  slackConnected: boolean;
}

export interface Email {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'scheduled' | 'processing' | 'sent' | 'failed';
  scheduledAt: string;
  sentAt: string | null;
  campaignId: string | null;
  errorMessage: string | null;
  etherealUrl: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ScheduleEmailRequest {
  senderEmail: string;
  subject: string;
  body: string;
  recipients: { email: string; name?: string }[];
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
}
