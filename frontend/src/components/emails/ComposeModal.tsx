import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Clock, Sliders } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { ScheduleEmailRequest } from '../../types';

export interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSchedule: (data: ScheduleEmailRequest) => Promise<any>;
  defaultSenderEmail?: string;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSchedule,
  defaultSenderEmail = '',
}) => {
  const [senderEmail, setSenderEmail] = useState(defaultSenderEmail);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<{ email: string; name?: string }[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default start time to 2 minutes from now formatted for datetime-local
  useEffect(() => {
    if (isOpen) {
      const now = new Date(Date.now() + 2 * 60 * 1000);
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setStartTime(localIso);
      if (defaultSenderEmail && !senderEmail) {
        setSenderEmail(defaultSenderEmail);
      }
    }
  }, [isOpen, defaultSenderEmail]);

  const parseCSVContent = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const firstLine = lines[0];
    const headers = firstLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

    let emailColIndex = headers.findIndex((h) =>
      /^(email|e-mail|recipient|to)$/i.test(h)
    );
    let nameColIndex = headers.findIndex((h) =>
      /^(name|full\s*name|first\s*name)$/i.test(h)
    );

    const hasHeader = emailColIndex !== -1 || /^[a-zA-Z]+$/.test(headers[0]);
    const startIndex = hasHeader ? 1 : 0;

    if (emailColIndex === -1) {
      // Default to column 0 if no header found
      emailColIndex = 0;
    }

    const detected: { email: string; name?: string }[] = [];
    const seenEmails = new Set<string>();

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i];
      const cols = row.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      let extractedEmail = cols[emailColIndex];

      // If the designated column isn't a valid email, search the row for an email
      if (!extractedEmail || !emailRegex.test(extractedEmail)) {
        const match = row.match(emailRegex);
        if (match) {
          extractedEmail = match[0];
        }
      }

      if (extractedEmail && emailRegex.test(extractedEmail)) {
        const cleanEmail = extractedEmail.toLowerCase().trim();
        if (!seenEmails.has(cleanEmail)) {
          seenEmails.add(cleanEmail);
          const name = nameColIndex !== -1 ? cols[nameColIndex] : undefined;
          detected.push({ email: cleanEmail, name });
        }
      }
    }

    return detected;
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseCSVContent(text);
        setRecipients(parsed);
        if (parsed.length === 0) {
          toast.error('No valid email addresses found in the uploaded file');
        } else {
          toast.success(`Detected ${parsed.length} recipient email addresses`);
        }
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const resetForm = () => {
    setSubject('');
    setBody('');
    setRecipients([]);
    setFileName(null);
    setDelayBetweenEmails(2);
    setHourlyLimit(50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderEmail || !senderEmail.includes('@')) {
      toast.error('Please enter a valid sender email');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }
    if (!body.trim()) {
      toast.error('Please enter an email body');
      return;
    }
    if (recipients.length === 0) {
      toast.error('Please upload a CSV or TXT file with recipient emails');
      return;
    }
    if (!startTime) {
      toast.error('Please select a scheduled start time');
      return;
    }

    const payload: ScheduleEmailRequest = {
      senderEmail: senderEmail.trim(),
      subject: subject.trim(),
      body: body.trim(),
      recipients,
      startTime: new Date(startTime).toISOString(),
      delayBetweenEmails: Number(delayBetweenEmails),
      hourlyLimit: Number(hourlyLimit),
    };

    setIsLoading(true);
    try {
      await onSchedule(payload);
      toast.success(`Successfully scheduled ${recipients.length} emails!`);
      resetForm();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule emails');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose & Schedule Campaign"
      description="Queue and throttle email campaigns with custom pacing and hourly limits."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Sender Email"
          type="email"
          placeholder="e.g. sender@example.com"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          required
        />

        <Input
          label="Subject"
          placeholder="Announcing our new feature updates..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <Input
          label="Email Body"
          isTextarea
          rows={5}
          placeholder="Write your email message here. Plain text and HTML supported."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />

        {/* CSV Dropzone */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300">
            Recipients (CSV or TXT)
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-5 transition-all text-center flex flex-col items-center justify-center ${
              isDragging
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-700 bg-dark-800/40 hover:bg-dark-800/70 hover:border-dark-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={onFileInputChange}
            />

            <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-primary-400 mb-2 border border-dark-700">
              <UploadCloud className="w-5 h-5" />
            </div>

            <p className="text-sm font-medium text-white">
              {fileName ? (
                <span className="flex items-center gap-1.5 text-primary-400">
                  <FileText className="w-4 h-4" /> {fileName}
                </span>
              ) : (
                'Click or drag & drop CSV or TXT file here'
              )}
            </p>
            <p className="text-xs text-dark-400 mt-1">
              Supports CSV with email column or plain text list of emails
            </p>
          </div>

          {/* Detected emails badge and preview */}
          {recipients.length > 0 && (
            <div className="mt-3 p-3 bg-dark-800/80 rounded-xl border border-dark-700 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="success" dot>
                  {recipients.length} email addresses detected
                </Badge>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecipients([]);
                    setFileName(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-dark-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {recipients.slice(0, 5).map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-dark-900 border border-dark-750 text-dark-300"
                  >
                    {r.email}
                  </span>
                ))}
                {recipients.length > 5 && (
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-dark-900 text-dark-400">
                    +{recipients.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scheduling Configurations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-dark-800">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-white text-xs px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">
              Delay (Sec)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={delayBetweenEmails}
              onChange={(e) => setDelayBetweenEmails(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-white text-xs px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-1.5">
              Hourly Limit
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-white text-xs px-3 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            Schedule Campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ComposeModal;
