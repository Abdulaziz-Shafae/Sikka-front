import assert from 'node:assert/strict';
import { formatNoticeTime } from '../../lib/notification-time.ts';

const now = new Date('2026-11-03T09:00:00Z');
assert.equal(formatNoticeTime('2026-11-03T09:36:00', now)?.day, 'اليوم');
assert.equal(formatNoticeTime('2026-11-02T20:12:00', now)?.day, 'أمس');
const older = formatNoticeTime('2026-10-30T16:15:00', now);
assert.ok(older?.day.includes('أكتوبر'));
assert.ok(older?.time);
assert.equal(formatNoticeTime(null, now), null);
assert.equal(formatNoticeTime('invalid', now), null);
assert.equal(formatNoticeTime('2026-11-03T00:30:00', new Date('2026-11-02T22:00:00Z'))?.day, 'اليوم');
console.log('Notification date formatting tests passed.');
