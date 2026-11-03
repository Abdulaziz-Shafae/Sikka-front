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

