import type { SessionRecord } from '@/store/app-store';

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Consecutive days with at least one session, counting back from today (or yesterday). */
export function currentStreak(sessions: SessionRecord[], now = new Date()) {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.endedAt))));
  const cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function sessionsToday(sessions: SessionRecord[], now = new Date()) {
  const today = dayKey(now);
  return sessions.filter((s) => dayKey(new Date(s.endedAt)) === today).length;
}

/** Minutes practiced on each of the last 7 days, oldest first. */
export function lastSevenDays(sessions: SessionRecord[], now = new Date()) {
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const key = dayKey(day);
    const seconds = sessions
      .filter((s) => dayKey(new Date(s.endedAt)) === key)
      .reduce((sum, s) => sum + s.durationSec, 0);
    return { date: day, minutes: Math.round(seconds / 60), isToday: i === 6 };
  });
}

export function totals(sessions: SessionRecord[]) {
  const minutes = Math.round(sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);
  const avgShift =
    sessions.length === 0
      ? null
      : sessions.reduce((sum, s) => sum + (s.after - s.before), 0) / sessions.length;
  return { count: sessions.length, minutes, avgShift };
}

export function formatShift(shift: number) {
  const rounded = Math.round(shift * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return rounded > 0 ? `+${text}` : text;
}

const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export const format = {
  weekday: (d: Date) => dayFormatter.format(d),
  date: (d: Date) => dateFormatter.format(d),
  time: (d: Date) => timeFormatter.format(d),
};
