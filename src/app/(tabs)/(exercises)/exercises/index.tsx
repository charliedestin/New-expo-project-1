import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen-scroll';
import { Radius, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/store/app-store';

export default function ExercisesScreen() {
  const theme = useTheme();
  const stage = useAppState((s) => s.stage);
  const router = useRouter();

  return (
    <ScreenScroll>
      <AppText variant="callout" tone="secondary" style={{ paddingHorizontal: Spacing.one }}>
        Six exercises, learned one at a time. Spend about a week on each before adding the next.
        Every session runs through all the exercises you’ve learned so far.
      </AppText>

      <Card padded={false}>
        {EXERCISES.map((exercise, i) => {
          const learned = exercise.stage < stage;
          const current = exercise.stage === stage;
          return (
            <Pressable
              key={exercise.id}
              onPress={() => router.push(`/exercises/${exercise.id}`)}
              accessibilityRole="button"
              accessibilityHint="Opens the exercise"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.four,
                paddingVertical: Spacing.four,
                paddingHorizontal: Spacing.five,
                minHeight: 72,
                backgroundColor: pressed ? theme.surfaceMuted : 'transparent',
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: theme.separator,
              })}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: Radius.tile,
                  borderCurve: 'continuous',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: current || learned ? theme.accentSoft : theme.surfaceMuted,
                }}>
                <Icon
                  name={exercise.icon}
                  size={22}
                  color={current || learned ? theme.accent : theme.textTertiary}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="footnote" tone="tertiary" numeric>
                  Stage {exercise.stage}
                </AppText>
                <AppText variant="headline">{exercise.title}</AppText>
                <AppText variant="footnote" tone="secondary" numberOfLines={1}>
                  {exercise.summary}
                </AppText>
              </View>
              {current ? (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: Radius.pill,
                    backgroundColor: theme.accent,
                  }}>
                  <AppText variant="footnote" tone="onAccent" style={{ fontWeight: '600' }}>
                    Current
                  </AppText>
                </View>
              ) : learned ? (
                <Icon
                  name={{
                    ios: 'checkmark.circle.fill',
                    android: 'check_circle',
                    web: 'check_circle',
                  }}
                  size={22}
                  color={theme.accent}
                />
              ) : null}
              <Icon
                name={{
                  ios: 'chevron.right',
                  android: 'chevron_right',
                  web: 'chevron_right',
                }}
                size={16}
                color={theme.textTertiary}
              />
            </Pressable>
          );
        })}
      </Card>
    </ScreenScroll>
  );
}
