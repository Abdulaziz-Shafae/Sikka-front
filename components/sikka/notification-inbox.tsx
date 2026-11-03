'use client';

import { useEffect, useState } from 'react';
import { Bell, CalendarDays, Check, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Visit } from '@/lib/sikka-data';
import { liveApi, type Notice } from '@/lib/live-api';

const RIYADH = 'Asia/Riyadh';
const dateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: RIYADH, year: 'numeric', month: '2-digit', day: '2-digit',
});
const arabicDate = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  timeZone: RIYADH, day: 'numeric', month: 'long', year: 'numeric',
});
const arabicClock = new Intl.DateTimeFormat('ar-SA', {
  timeZone: RIYADH, hour: 'numeric', minute: '2-digit', hour12: true,
});

/** Backend LocalDateTime values are in Asia/Riyadh, not browser-local time. */
export function formatNoticeTime(value: string | null | undefined, now = new Date()) {
  if (!value) return null;
  const normalized = /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?$/.test(value)
    ? value + '+03:00'
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  const today = dateKey.format(now);
  const yesterday = dateKey.format(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const key = dateKey.format(date);
  const day = key === today ? 'اليوم' : key === yesterday ? 'أمس' : arabicDate.format(date);
  return { day, time: arabicClock.format(date), fullDate: arabicDate.format(date) };
}

export function NotificationInbox({ visits, onOpen }: { visits: Visit[]; onOpen: (visit: Visit) => void }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number[]>([]);

  async function loadNotices() {
    setLoading(true);
    try {
      const result = await liveApi.notices();
      setNotices(Array.isArray(result) ? result : []);
      setError('');
    } catch {
      setError('ما قدرنا نحمّل تنبيهاتك. جرّب مرة ثانية.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadNotices(); }, []);

  async function markRead(id: number) {
    if (busy.includes(id)) return;
    setBusy(current => [...current, id]);
    try {
      await liveApi.readNotice(id);
      setNotices(current => current.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setError('');
    } catch {
      setError('ما قدرنا نحفظ قراءة التنبيه. جرّب مرة ثانية.');
    } finally {
      setBusy(current => current.filter(value => value !== id));
    }
  }

  const unread = notices.filter(notice => !notice.readAt);
  return (
    <div className="container page-space narrow-page" dir="rtl">
      <div className="sikka-notification-heading">
        <h1>آخر أخبار سكتك</h1>
        <Button variant="outline" disabled={loading || !unread.length} onClick={async () => {
          for (const notice of unread) await markRead(notice.id);
        }}>
          <Check size={16} /> قراءة الكل
        </Button>
      </div>
      {error && <div className="readiness-errors" role="alert">{error} <Button variant="outline" size="sm" onClick={() => void loadNotices()}>إعادة المحاولة</Button></div>}
      {loading && <p role="status">نحمّل تنبيهاتك…</p>}
      {!loading && !notices.length && !error && <div className="sikka-notification-card">ما عندك تنبيهات حاليًا.</div>}
      {!loading && notices.map(notice => {
        const timestamp = formatNoticeTime(notice.sentAt || notice.createdAt);
        const relatedVisit = visits.find(visit => String(visit.id) === String(notice.visitId));
        return (
          <article className="sikka-notification-card" key={notice.id}>
            <div className="sikka-notification-card-head">
              <h2><Bell size={19} aria-hidden="true" />{notice.title || 'تحديث من سكة'}</h2>
              {!notice.readAt && <span className="sikka-notification-new">جديد</span>}
            </div>
            <p className="sikka-notification-message">{notice.message}</p>
            {timestamp && (
              <div className="sikka-notification-timestamp" title={timestamp.fullDate + ' · ' + timestamp.time}>
                <span><CalendarDays size={16} aria-hidden="true" />{timestamp.day}</span>
                <span><Clock3 size={16} aria-hidden="true" /><time dateTime={notice.sentAt || notice.createdAt || undefined}>{timestamp.time}</time></span>
              </div>
            )}
            <div className="sikka-notification-actions">
              {relatedVisit && <Button onClick={() => { if (!notice.readAt) void markRead(notice.id); onOpen(relatedVisit); }}>افتح الزيارة</Button>}
              <Button variant="outline" disabled={!!notice.readAt || busy.includes(notice.id)} onClick={() => void markRead(notice.id)}>
                {notice.readAt ? 'تمت القراءة' : 'تمت القراءة'}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
