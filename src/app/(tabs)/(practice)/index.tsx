import { Link, Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { ScreenScroll, SectionHeader } from '@/components/screen-scroll';
import { StepRow } from '@/components/step-row';
import { Radius, Spacing } from '@/constants/theme';
import { EXERCISES, MAX_STAGE } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { buildSessionPlan, formatMinutes, planDurationSec } from '@/lib/session-plan';
import { currentStreak, lastSevenDays, sessionsToday } from '@/lib/stats';
import { actions, useAppState } from '@/store/app-store';

export default function PracticeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const stage = useAppState((s) => s.stage);
  const settings = useAppState((s) => s.settings);
  const sessions = useAppState((s) => s.sessions);
  const seenIntro = useAppState((s) => s.seenIntro);

  const plan = buildSessionPlan(stage, settings);
  const exercise = EXERCISES[stage - 1];
  const streak = currentStreak(sessions);
  const today = sessionsToday(sessions);
  const weekMinutes = lastSevenDays(sessions).reduce((sum, d) => sum + d.minutes, 0);
  const exerciseSteps = plan.filter((s) => s.kind === 'exercise');

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                hitSlop={10}
                style={{ padding: Spacing.one }}>
                <Icon
                  name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
                  size={22}
                  color={theme.accent}
                />
              </Pressable>
            </Link>
          ),
        }}
      />
      <ScreenScroll>
        {!seenIntro && (
          <Card tone="accent" style={{ gap: Spacing.three }}>
            <AppText variant="headline">New to autogenic training?</AppText>
            <AppText variant="callout" tone="secondary">
              You’ll repeat short phrases silently and let your body follow them. Sit or lie
              somewhere quiet, 2–3 times a day. Add one exercise at a time, about a week each.
            </AppText>
            <AppText variant="footnote" tone="secondary">
              Never practice while driving. If you have a heart condition, epilepsy, or a serious
              mental health condition, check with a clinician first.
            </AppText>
            <Button
              label="Got it"
              variant="secondary"
              size="medium"
              style={{ alignSelf: 'flex-start', marginTop: Spacing.one }}
              onPress={() => {
                haptic.light();
                actions.dismissIntro();
              }}
            />
          </Card>
        )}

        <Card style={{ gap: Spacing.five, padding: Spacing.six }}>
          <View style={{ gap: Spacing.two }}>
            <AppText variant="caption" tone="accent">
              Stage {stage} of {MAX_STAGE}
            </AppText>
            <AppText variant="display">{exercise.title}</AppText>
            <AppText variant="callout" tone="secondary">
              {formatMinutes(planDurationSec(plan))} ·{' '}
              {exerciseSteps.length === 1 ? '1 exercise' : `${exerciseSteps.length} exercises`}
              {today > 0 ? ` · ${today === 1 ? 'Done once today' : `Done ${today}× today`}` : ''}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
            {exerciseSteps.map((step) => (
              <View
                key={step.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingLeft: 10,
                  paddingRight: 12,
                  borderRadius: Radius.pill,
                  backgroundColor: theme.surfaceMuted,
                }}>
                <Icon name={step.icon} size={15} color={theme.textSecondary} />
                <AppText variant="footnote" tone="secondary" style={{ fontWeight: '500' }}>
                  {step.title}
                </AppText>
              </View>
            ))}
          </View>

          <Button
            label="Begin session"
            icon={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
            onPress={() => {
              haptic.light();
              router.push('/session');
            }}
          />
        </Card>

        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <StatTile value={String(streak)} unit={streak === 1 ? 'day' : 'days'} label="Streak" />
          <StatTile value={String(weekMinutes)} unit="min" label="Last 7 days" />
        </View>

        <SectionHeader>
          <AppText variant="caption" tone="tertiary">
            Today’s sequence
          </AppText>
        </SectionHeader>
        <Card padded={false}>
          {plan
            .filter((s) => s.kind !== 'return')
            .map((step, i) => (
              <StepRow
                key={step.key}
                icon={step.icon}
                title={step.phrase}
                detail={`${step.title} · ${step.repetitions}×`}
                muted={step.kind === 'calm'}
                divider={i > 0}
              />
            ))}
          <StepRow
            icon={{ ios: 'sunrise', android: 'partly_cloudy_day', web: 'partly_cloudy_day' }}
            title="Come back"
            detail="Arms firm, breathe deeply, eyes open"
            muted
            divider
          />
        </Card>
      </ScreenScroll>
    </>
  );
}

function StatTile({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <Card style={{ flex: 1, gap: Spacing.one, padding: Spacing.five }}>
      <AppText variant="footnote" tone="secondary">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <AppText variant="stat" numeric selectable>
          {value}
        </AppText>
        <AppText variant="callout" tone="secondary">
          {unit}
        </AppText>
      </View>
    </Card>
  );
}
