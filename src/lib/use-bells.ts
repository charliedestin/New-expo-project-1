import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

/**
 * Two singing-bowl tones, synthesized for this app (assets/sounds):
 * `bell` opens the session and marks each new exercise; `bellLow` closes it.
 * People practice with their eyes closed, so sound is how they know where they are.
 */
export function useBells() {
  const bell = useAudioPlayer(require('@/assets/sounds/bell.wav'));
  const bellLow = useAudioPlayer(require('@/assets/sounds/bell-low.wav'));

  useEffect(() => {
    // Play even with the ringer switch off, and duck (not stop) other audio.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
  }, []);

  const strike = (player: typeof bell, volume: number) => {
    try {
      player.volume = volume;
      player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // A missing audio route shouldn't break the session.
    }
  };

  return {
    open: () => strike(bell, 0.7),
    next: () => strike(bell, 0.45),
    close: () => strike(bellLow, 0.8),
  };
}
