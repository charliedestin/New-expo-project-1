import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Group, ICON_ROW_INSET, Row } from '@/components/group';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen-scroll';
import { Radius, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/store/app-store';

export default function ExercisesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const stage = useAppState((s) => s.stage);

  return (
    <ScreenScroll>
      <Group footer="Learn one exercise at a time, about a week each. Every session runs through all the exercises you’ve learned so far.">
        {EXERCISES.map((exercise) => {
          const learned = exercise.stage < stage;
          const current = exercise.stage === stage;
          return (
            <Row
              key={exercise.id}
              icon={exercise.icon}
              iconMuted={!learned && !current}
              title={exercise.title}
              detail={exercise.summary}
              separatorInset={ICON_ROW_INSET}
              chevron
              accessibilityHint={current ? 'Current stage' : learned ? 'Learned' : undefined}
              onPress={() => router.push(`/exercises/${exercise.id}`)}
              trailing={
                current ? (
                  <View
                    style={{
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: 3,
                      borderRadius: Radius.capsule,
                      backgroundColor: theme.accentSoft,
                    }}>
                    <AppText variant="caption" tone="accent" weight="600">
                      Current
                    </AppText>
                  </View>
                ) : learned ? (
                  <Icon
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={15}
                    weight="semibold"
                    color={theme.accent}
                  />
                ) : (
                  <AppText variant="subhead" tone="tertiary" numeric>
                    {exercise.stage}
                  </AppText>
                )
              }
            />
          );
        })}
      </Group>
    </ScreenScroll>
  );
}
