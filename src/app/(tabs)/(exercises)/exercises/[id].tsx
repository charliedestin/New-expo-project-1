import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Group } from '@/components/group';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen-scroll';
import { ScreenInset, Spacing } from '@/constants/theme';
import { exerciseById } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { actions, useAppState } from '@/store/app-store';

export default function ExerciseDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const stage = useAppState((s) => s.stage);
  const exercise = exerciseById(id);

  if (!exercise) {
    return (
      <ScreenScroll>
        <Stack.Screen options={{ title: 'Not found' }} />
        <View style={{ gap: Spacing.sm, paddingTop: Spacing.xxl }}>
          <AppText variant="headline" center>
            This exercise doesn’t exist
          </AppText>
          <AppText variant="subhead" tone="secondary" center>
            Go back and choose one of the six exercises.
          </AppText>
        </View>
      </ScreenScroll>
    );
  }

  const isCurrent = exercise.stage === stage;
  const isLearned = exercise.stage < stage;

  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: exercise.title }} />

      <View style={{ gap: Spacing.md, paddingHorizontal: Spacing.xs, paddingTop: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Icon name={exercise.icon} size={17} color={theme.accent} />
          <AppText variant="subhead" tone="secondary">
            Stage {exercise.stage}
            {isCurrent ? ' · Current' : isLearned ? ' · Learned' : ''}
          </AppText>
        </View>
        <AppText variant="phrase" selectable>
          {exercise.formula}
        </AppText>
      </View>

      <Group title="What you may notice">
        <AppText variant="body" style={{ padding: ScreenInset }}>
          {exercise.notice}
        </AppText>
      </Group>

      <Group title="How to practice" footer={exercise.caution}>
        <AppText variant="body" style={{ padding: ScreenInset }}>
          {exercise.howTo}
        </AppText>
      </Group>

      {!isCurrent ? (
        <View style={{ gap: Spacing.sm }}>
          <Button
            label={
              isLearned ? `Go back to stage ${exercise.stage}` : `Move to stage ${exercise.stage}`
            }
            variant={isLearned ? 'secondary' : 'primary'}
            onPress={() => {
              haptic.success();
              actions.setStage(exercise.stage);
            }}
          />
          <AppText variant="footnote" tone="secondary" center>
            {isLearned
              ? 'Sessions will stop after this exercise.'
              : 'Sessions will include every exercise up to this one. Most people wait until the current one comes easily.'}
          </AppText>
        </View>
      ) : null}
    </ScreenScroll>
  );
}
