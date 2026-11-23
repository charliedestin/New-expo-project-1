import { MAX_STAGE } from '@/data/exercises';
import type { Felt, SessionRecord } from '@/store/app-store';

const DAY_MS = 86_400_000;

/** Classic guidance is two or three short sessions a day. */
export const DAILY_TARGET = 3;

/** How many recent sessions the readiness check looks at, and how many must be "clearly". */
const READINESS_WINDOW = 5;
const READINESS_CLEARLY = 3;
const READINESS_DAYS = 5;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function sessionsOn(sessions: SessionRecord[], day: Date) {
  const key = dayKey(day);
  return sessions.filter((s) => dayKey(new Date(s.endedAt)) === key);
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

/** Session counts for the last 7 days, oldest first. */
export function lastSevenDays(sessions: SessionRecord[], now = new Date()) {
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return { date, count: sessionsOn(sessions, date).length, isToday: i === 6 };
  });
}

export type Readiness = {
  /** "Felt" reports from the latest sessions at this stage, newest first. */
  recent: (Felt | null)[];
  clearly: number;
  practiceDays: number;
  daysAtStage: number;
  ready: boolean;
};

/**
 * Whether it's time to add the next exercise: the current sensation has come clearly in most
 * recent sessions, over at least five days of practice.
 */
export function stageReadiness(
  sessions: SessionRecord[],
  stage: number,
  stageSince: string,
  now = new Date(),
): Readiness {
  const since = new Date(stageSince).getTime();
  const atStage = sessions.filter(
    (s) => s.stage === stage && new Date(s.endedAt).getTime() >= since,
  );
  const recent = atStage.slice(0, READINESS_WINDOW).map((s) => s.felt);
  const clearly = recent.filter((f) => f === 'clearly').length;
  const practiceDays = new Set(atStage.map((s) => dayKey(new Date(s.endedAt)))).size;
  const daysAtStage =
    Math.floor((startOfDay(now).getTime() - startOfDay(new Date(since)).getTime()) / DAY_MS) + 1;

  return {
    recent,
    clearly,
    practiceDays,
    daysAtStage,
    ready:
      stage < MAX_STAGE &&
      recent.length >= READINESS_WINDOW &&
      clearly >= READINESS_CLEARLY &&
      practiceDays >= READINESS_DAYS,
  };
}

export function formatDuration(totalSec: number) {
  const minutes = Math.round(totalSec / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const narrowDay = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const longDay = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** "Today", "Yesterday", a weekday within the week, then a short date. */
export function relativeDay(date: Date, now = new Date()) {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return weekday.format(date);
  return longDay.format(date);
}

export const format = {
  narrowDay: (d: Date) => narrowDay.format(d),
  weekday: (d: Date) => weekday.format(d),
  time: (d: Date) => time.format(d),
};

export const FELT_LABEL: Record<Felt, string> = {
  clearly: 'Clearly',
  somewhat: 'A little',
  'not-yet': 'Not yet',
};
