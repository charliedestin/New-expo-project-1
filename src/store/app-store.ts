import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { MAX_STAGE } from '@/data/exercises';

export type Pace = 'steady' | 'slow';
export type VoiceMode = 'off' | 'once' | 'every';
/** How clearly the current exercise's sensation came. The core of an autogenic practice diary. */
export type Felt = 'clearly' | 'somewhat' | 'not-yet';

export type Settings = {
  voice: VoiceMode;
  bell: boolean;
  haptics: boolean;
  repetitions: number;
  pace: Pace;
};

export type SessionRecord = {
  id: string;
  /** ISO timestamp of when the session ended. */
  endedAt: string;
  durationSec: number;
  stage: number;
  /** Calm rating 1–10 before. */
  before: number;
  /** Calm rating after. Null for bedtime sessions, which end without a check-out. */
  after: number | null;
  felt: Felt | null;
  bedtime: boolean;
};

export type AppState = {
  hydrated: boolean;
  stage: number;
  /** When the current stage began, to pace progression (about a week per exercise). */
  stageSince: string;
  seenIntro: boolean;
  /** Stage the user said "not yet" to, so the suggestion doesn't nag. */
  snoozedStage: number | null;
  settings: Settings;
  sessions: SessionRecord[];
};

const STORAGE_KEY = 'autogenic/state/v1';

const initialState: AppState = {
  hydrated: false,
  stage: 1,
  stageSince: new Date().toISOString(),
  seenIntro: false,
  snoozedStage: null,
  settings: { voice: 'once', bell: true, haptics: true, repetitions: 6, pace: 'steady' },
  sessions: [],
};

let state: AppState = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  emit();
  persist();
}

function persist() {
  if (!state.hydrated) return;
  const { hydrated: _hydrated, ...data } = state;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
    // Storage is best-effort; the app keeps working in memory.
  });
}

/** Accepts data saved by older versions of the app. */
function migrate(saved: Record<string, unknown>): Partial<AppState> {
  const settings = { ...initialState.settings, ...(saved.settings as object) } as Settings & {
    voice: unknown;
  };
  if (typeof settings.voice === 'boolean') settings.voice = settings.voice ? 'once' : 'off';
  const sessions = Array.isArray(saved.sessions)
    ? (saved.sessions as Partial<SessionRecord>[]).map((s) => ({
        felt: null,
        bedtime: false,
        ...s,
        after: s.after ?? null,
      }))
    : [];
  return {
    ...(saved as Partial<AppState>),
    settings: settings as Settings,
    sessions: sessions as SessionRecord[],
    stageSince: typeof saved.stageSince === 'string' ? saved.stageSince : initialState.stageSince,
    snoozedStage: typeof saved.snoozedStage === 'number' ? saved.snoozedStage : null,
  };
}

let hydration: Promise<void> | null = null;

export function hydrate() {
  hydration ??= (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) state = { ...state, ...migrate(JSON.parse(raw)) };
    } catch {
      // Corrupt or unavailable storage: start fresh rather than crash.
    }
    state = { ...state, hydrated: true };
    emit();
  })();
  return hydration;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Selectors must return stored references (no new arrays or objects), or React loops. */
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

/** Current state outside React (the feedback layer reads the user's toggles here). */
export function getState(): AppState {
  return state;
}

export const actions = {
  setStage(stage: number) {
    const next = Math.min(Math.max(1, stage), MAX_STAGE);
    if (next === state.stage) return;
    setState({ stage: next, stageSince: new Date().toISOString(), snoozedStage: null });
  },
  snoozeAdvance() {
    setState({ snoozedStage: state.stage });
  },
  dismissIntro() {
    setState({ seenIntro: true });
  },
  updateSettings(patch: Partial<Settings>) {
    setState({ settings: { ...state.settings, ...patch } });
  },
  addSession(record: Omit<SessionRecord, 'id'>) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setState({ sessions: [{ id, ...record }, ...state.sessions] });
  },
  resetProgress() {
    setState({
      sessions: [],
      stage: 1,
      stageSince: new Date().toISOString(),
      snoozedStage: null,
    });
  },
};
