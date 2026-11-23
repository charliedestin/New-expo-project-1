import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

/** Slow breathing guide: 4 s in, 6 s out (six breaths a minute). */
const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const SINE = Easing.inOut(Easing.sin);

type Props = { size: number; paused: boolean };

export function BreathingOrb({ size, paused }: Props) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const breath = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      cancelAnimation(breath);
      return;
    }
    breath.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: INHALE_MS, easing: SINE }),
          withTiming(0, { duration: EXHALE_MS, easing: SINE }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(breath);
  }, [paused, breath]);

  // Reduce Motion: no growth, just a gentle brightness change.
  const outerStyle = useAnimatedStyle(() => {
    const b = breath.get();
    return reduceMotion
      ? { opacity: 0.35 + b * 0.35 }
      : { opacity: 0.45 + b * 0.25, transform: [{ scale: 0.78 + b * 0.22 }] };
  });
  const innerStyle = useAnimatedStyle(() => {
    const b = breath.get();
    return reduceMotion ? { opacity: 0.8 } : { transform: [{ scale: 0.86 + b * 0.14 }] };
  });

  const ring = (scale: number, opacity: number) => ({
    position: 'absolute' as const,
    width: size * scale,
    height: size * scale,
    borderRadius: (size * scale) / 2,
    backgroundColor: theme.accent,
    opacity,
  });

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel="Breathing guide. Breathe in as it grows, out as it shrinks.">
      <Animated.View style={[ring(1, 0.12), outerStyle]} />
      <Animated.View style={[ring(0.72, 0.18), outerStyle]} />
      <Animated.View style={[ring(0.46, 0.9), innerStyle]} />
    </View>
  );
}
