import { Host, Slider } from '@expo/ui';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { SessionPalette, Spacing } from '@/constants/theme';
import { fire } from '@/lib/feedback';

const WORDS = ['Very tense', 'Tense', 'Uneasy', 'Okay', 'Relaxed', 'Calm', 'Very calm'];

function describe(value: number) {
  // 1–10 onto seven words: 1 very tense … 10 very calm.
  return WORDS[Math.min(WORDS.length - 1, Math.floor(((value - 1) / 9) * (WORDS.length - 0.01)))];
}

type Props = { value: number; onChange: (value: number) => void };

/** A 1–10 calm rating on the native slider, styled for the session's dim palette. */
export function CalmScale({ value, onChange }: Props) {
  return (
    <View style={{ gap: Spacing.lg, width: '100%' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: Spacing.sm,
        }}
        accessibilityLiveRegion="polite">
        <AppText variant="title" numeric color={SessionPalette.text}>
          {value}
        </AppText>
        <AppText variant="subhead" color={SessionPalette.textSecondary}>
          {describe(value)}
        </AppText>
      </View>
      <Host
        matchContents={{ vertical: true }}
        colorScheme="dark"
        seedColor={SessionPalette.accent}
        style={{ width: '100%' }}>
        <Slider
          value={value}
          min={1}
          max={10}
          step={1}
          onValueChange={(next) => {
            const rounded = Math.round(next);
            if (rounded !== value) {
              fire('select');
              onChange(rounded);
            }
          }}
        />
      </Host>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="footnote" color={SessionPalette.textTertiary}>
          Tense
        </AppText>
        <AppText variant="footnote" color={SessionPalette.textTertiary}>
          Calm
        </AppText>
      </View>
    </View>
  );
}
