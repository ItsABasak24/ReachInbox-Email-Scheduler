import { useState, useCallback } from 'react';
import api from '../api/client';
import { Email, PaginatedResponse, ScheduleEmailRequest } from '../types';

export const useEmails = () => {
  const [scheduledEmails, setScheduledEmails] = useState<PaginatedResponse<Email>>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const [sentEmails, setSentEmails] = useState<PaginatedResponse<Email>>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduled = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await api.get('/emails/scheduled', {
          params: { page, limit: 10, search: search.trim() || undefined },
        });
      } catch (err: any) {
        if (err.response?.status === 404) {
          res = await api.get('/emails', {
            params: { status: 'scheduled', page, limit: 10, search: search.trim() || undefined },
          });
        } else {
          throw err;
        }
      }

      const resData = res.data;
      if (Array.isArray(resData)) {
        setScheduledEmails({
          data: resData,
          total: resData.length,
          page: 1,
          totalPages: 1,
        });
      } else if (resData && Array.isArray(resData.data)) {
        setScheduledEmails({
          data: resData.data,
          total: resData.total ?? resData.data.length,
          page: resData.page ?? page,
          totalPages: resData.totalPages ?? Math.max(1, Math.ceil((resData.total ?? resData.data.length) / 10)),
        });
      } else if (resData && Array.isArray(resData.emails)) {
        setScheduledEmails({
          data: resData.emails,
          total: resData.total ?? resData.emails.length,
          page: resData.page ?? page,
          totalPages: resData.totalPages ?? Math.max(1, Math.ceil((resData.total ?? resData.emails.length) / 10)),
        });
      } else {
        setScheduledEmails({ data: [], total: 0, page: 1, totalPages: 1 });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch scheduled emails';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSent = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await api.get('/emails/sent', {
          params: { page, limit: 10, search: search.trim() || undefined },
        });
      } catch (err: any) {
        if (err.response?.status === 404) {
          res = await api.get('/emails', {
            params: { status: 'sent', page, limit: 10, search: search.trim() || undefined },
          });
        } else {
          throw err;
        }
      }

      const resData = res.data;
      if (Array.isArray(resData)) {
        setSentEmails({
          data: resData,
          total: resData.length,
          page: 1,
          totalPages: 1,
        });
      } else if (resData && Array.isArray(resData.data)) {
        setSentEmails({
          data: resData.data,
          total: resData.total ?? resData.data.length,
          page: resData.page ?? page,
          totalPages: resData.totalPages ?? Math.max(1, Math.ceil((resData.total ?? resData.data.length) / 10)),
        });
      } else if (resData && Array.isArray(resData.emails)) {
        setSentEmails({
          data: resData.emails,
          total: resData.total ?? resData.emails.length,
          page: resData.page ?? page,
          totalPages: resData.totalPages ?? Math.max(1, Math.ceil((resData.total ?? resData.emails.length) / 10)),
        });
      } else {
        setSentEmails({ data: [], total: 0, page: 1, totalPages: 1 });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch sent emails';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleEmails = async (data: ScheduleEmailRequest) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await api.post('/emails/schedule', data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          res = await api.post('/emails', data);
        } else {
          throw err;
        }
      }
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to schedule emails';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const searchEmails = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        let res;
        try {
          res = await api.get('/emails/search', { params: { q: query } });
        } catch {
          // If dedicated search endpoint is not implemented, query both lists
          await Promise.all([fetchScheduled(1, query), fetchSent(1, query)]);
          return;
        }
        const data = res.data?.data || res.data?.emails || res.data;
        return Array.isArray(data) ? data : [];
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Search failed';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [fetchScheduled, fetchSent]
  );

  return {
    scheduledEmails,
    sentEmails,
    loading,
    error,
    fetchScheduled,
    fetchSent,
    scheduleEmails,
    searchEmails,
  };
};

export default useEmails;
