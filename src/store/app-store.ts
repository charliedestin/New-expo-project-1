import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { MAX_STAGE } from '@/data/exercises';

export type Pace = 'steady' | 'slow';

export type Settings = {
  voice: boolean;
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
  /** Calm rating 1–10 before and after. */
  before: number;
  after: number;
};

export type AppState = {
  hydrated: boolean;
  stage: number;
  seenIntro: boolean;
  settings: Settings;
  sessions: SessionRecord[];
};

const STORAGE_KEY = 'autogenic/state/v1';

const initialState: AppState = {
  hydrated: false,
  stage: 1,
  seenIntro: false,
  settings: { voice: true, haptics: true, repetitions: 6, pace: 'steady' },
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

let hydration: Promise<void> | null = null;

export function hydrate() {
  hydration ??= (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        state = {
          ...state,
          ...saved,
          settings: { ...initialState.settings, ...saved.settings },
          sessions: Array.isArray(saved.sessions) ? saved.sessions : [],
        };
      }
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

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

export const actions = {
  setStage(stage: number) {
    setState({ stage: Math.min(Math.max(1, stage), MAX_STAGE) });
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
    setState({ sessions: [], stage: 1 });
  },
};
