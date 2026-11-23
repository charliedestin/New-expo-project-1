import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen-scroll';
import { Radius, Spacing } from '@/constants/theme';
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
        <AppText variant="headline">This exercise doesn’t exist.</AppText>
        <AppText variant="callout" tone="secondary">
          Go back to the list and choose one of the six exercises.
        </AppText>
      </ScreenScroll>
    );
  }

  const isCurrent = exercise.stage === stage;
  const isLearned = exercise.stage < stage;

  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: exercise.title }} />

      <View style={{ alignItems: 'center', gap: Spacing.four, paddingTop: Spacing.four }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accentSoft,
          }}>
          <Icon name={exercise.icon} size={40} color={theme.accent} />
        </View>
        <AppText variant="caption" tone="accent">
          Stage {exercise.stage}
        </AppText>
        <AppText variant="display" center selectable style={{ paddingHorizontal: Spacing.four }}>
          “{exercise.formula}”
        </AppText>
      </View>

      <Card style={{ gap: Spacing.five }}>
        <Section title="What you may notice" body={exercise.notice} />
        <View style={{ height: 1, backgroundColor: theme.separator }} />
        <Section title="How to practice" body={exercise.howTo} />
      </Card>

      {exercise.caution && (
        <Card tone="muted" style={{ flexDirection: 'row', gap: Spacing.three }}>
          <Icon
            name={{ ios: 'info.circle', android: 'info', web: 'info' }}
            size={20}
            color={theme.textSecondary}
          />
          <AppText variant="callout" tone="secondary" style={{ flex: 1 }}>
            {exercise.caution}
          </AppText>
        </Card>
      )}

      {isCurrent ? (
        <View
          style={{
            minHeight: 54,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: theme.separator,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: Spacing.two,
          }}>
          <Icon
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={18}
            color={theme.textSecondary}
          />
          <AppText variant="headline" tone="secondary">
            Your current stage
          </AppText>
        </View>
      ) : (
        <View style={{ gap: Spacing.two }}>
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
          <AppText variant="footnote" tone="tertiary" center>
            {isLearned
              ? 'Sessions will include only the exercises up to this one.'
              : 'Sessions will include every exercise up to this one.'}
          </AppText>
        </View>
      )}
    </ScreenScroll>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <AppText variant="headline">{title}</AppText>
      <AppText variant="body" tone="secondary">
        {body}
      </AppText>
    </View>
  );
}
