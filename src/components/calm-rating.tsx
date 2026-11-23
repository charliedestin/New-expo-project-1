import { Host, Slider } from '@expo/ui';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const LABELS: Record<number, string> = {
  1: 'Very tense',
  3: 'Tense',
  5: 'Okay',
  7: 'Relaxed',
  9: 'Very calm',
};

function describe(value: number) {
  const key = [9, 7, 5, 3, 1].find((k) => value >= k) ?? 1;
  return LABELS[key];
}

/** A 1–10 calm rating on the native slider. */
export function CalmRating({ value, onChange }: Props) {
  const theme = useTheme();
  const scheme = useColorScheme();
  return (
    <View style={{ gap: Spacing.four, width: '100%' }}>
      <View style={{ alignItems: 'center', gap: Spacing.one }}>
        <AppText variant="stat" tone="accent" numeric accessibilityLiveRegion="polite">
          {value}
        </AppText>
        <AppText variant="callout" tone="secondary">
          {describe(value)}
        </AppText>
      </View>
      <Host
        matchContents={{ vertical: true }}
        seedColor={theme.accent}
        colorScheme={scheme ?? undefined}
        style={{ width: '100%' }}>
        <Slider
          value={value}
          min={1}
          max={10}
          step={1}
          onValueChange={(next) => {
            const rounded = Math.round(next);
            if (rounded !== value) {
              haptic.selection();
              onChange(rounded);
            }
          }}
        />
      </Host>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="footnote" tone="tertiary">
          Tense
        </AppText>
        <AppText variant="footnote" tone="tertiary">
          Calm
        </AppText>
      </View>
    </View>
  );
}
