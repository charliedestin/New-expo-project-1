import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';

import { getState } from '@/store/app-store';

/**
 * The app's feedback vocabulary. Call sites name what happened; this module alone decides which
 * channels fire (haptics, bell), so no event can double-fire from two layers.
 *
 * Rarity gradient (smallest → biggest):
 *   select < pause < phrase < sessionStart < comeBack < saved < stageAdded < milestone
 * During practice the person's eyes are closed, so practice events lead with sound; haptics
 * only reach someone holding the phone.
 */
export type FeedbackEvent =
  | 'select' // a slider step or a choice
  | 'pause' // pause / resume
  | 'phrase' // a new phrase begins
  | 'sessionStart' // the first phrase of a session
  | 'comeBack' // relaxation is over: time to come back
  | 'saved' // a session is saved
  | 'stageAdded' // the next exercise is added (about weekly)
  | 'milestone' // the current exercise has come reliably (the rarest moment)
  | 'reset'; // progress erased

const canBuzz = process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android';

const impact = (style: Haptics.ImpactFeedbackStyle) => () => Haptics.impactAsync(style);
const sequence = (steps: (() => Promise<void>)[], gapMs: number) => () => {
  steps.forEach((step, i) => setTimeout(() => step().catch(() => {}), i * gapMs));
  return Promise.resolve();
};

const { Light, Medium, Soft } = Haptics.ImpactFeedbackStyle;

/** One shape per event. Rarer events get longer, rising patterns; nothing else repeats them. */
const HAPTICS: Partial<Record<FeedbackEvent, () => Promise<void>>> = {
  select: () => Haptics.selectionAsync(),
  pause: impact(Light),
  phrase: impact(Soft),
  sessionStart: impact(Light),
  comeBack: sequence([impact(Soft), impact(Medium)], 180),
  saved: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  stageAdded: sequence([impact(Light), impact(Medium)], 130),
  milestone: sequence([impact(Soft), impact(Light), impact(Medium)], 150),
  reset: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

type Tone = 'high' | 'low';
/** Bell strikes per event: tone, volume, delay. Loudness also follows the rarity gradient. */
const SOUNDS: Partial<Record<FeedbackEvent, { tone: Tone; volume: number; at: number }[]>> = {
  phrase: [{ tone: 'high', volume: 0.42, at: 0 }],
  sessionStart: [{ tone: 'high', volume: 0.7, at: 0 }],
  comeBack: [{ tone: 'low', volume: 0.8, at: 0 }],
  // The only two-note sound in the app: low then high, a rising interval.
  milestone: [
    { tone: 'low', volume: 0.45, at: 0 },
    { tone: 'high', volume: 0.5, at: 420 },
  ],
};

let players: Record<Tone, AudioPlayer> | null = null;

/**
 * Audio policy (deliberate; see README):
 * - Bells play through the silent switch during a session the person started. Many people
 *   silence their phone before practicing, and a session without its bells can't be followed
 *   with eyes closed. The Bell toggle is the in-app mute.
 * - Bells mix with other audio instead of ducking it, so someone's own music isn't dipped at
 *   every phrase.
 * The policy is re-asserted before each strike because speech synthesis can change the session.
 */
function assertAudioPolicy() {
  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
}

/** Load the bells ahead of time so the first strike has no delay. Call when a session opens. */
export function prepareFeedback() {
  if (players) return;
  assertAudioPolicy();
  players = {
    high: createAudioPlayer(require('@/assets/sounds/bell.wav')),
    low: createAudioPlayer(require('@/assets/sounds/bell-low.wav')),
  };
}

function strike(tone: Tone, volume: number) {
  if (!players) prepareFeedback();
  const player = players![tone];
  try {
    assertAudioPolicy();
    player.volume = volume;
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // A missing audio route must never break a session.
  }
}

/**
 * Fire an event. Returns true when a sound played, so speech can wait for the bell to ring out.
 */
export function fire(event: FeedbackEvent): boolean {
  const { settings } = getState();

  const haptic = HAPTICS[event];
  if (haptic && canBuzz && settings.haptics) haptic().catch(() => {});

  const sound = SOUNDS[event];
  // The Bell setting is the app's mute switch, for every sound.
  if (!sound || !settings.bell) return false;
  sound.forEach(({ tone, volume, at }) =>
    at ? setTimeout(() => strike(tone, volume), at) : strike(tone, volume),
  );
  return true;
}

/** For screen-reader users: say what changed, without competing with the app's own voice. */
export function announce(message: string) {
  AccessibilityInfo.isScreenReaderEnabled()
    .then((on) => on && AccessibilityInfo.announceForAccessibility(message))
    .catch(() => {});
}
