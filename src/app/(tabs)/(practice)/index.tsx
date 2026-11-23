import { Link, Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { DayPips } from '@/components/day-pips';
import { Group, ICON_ROW_INSET, Row } from '@/components/group';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen-scroll';
import { ScreenInset, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { buildSessionPlan, formatMinutes, planDurationSec, RETURN_ICON } from '@/lib/session-plan';
import { DAILY_TARGET, sessionsOn, stageReadiness } from '@/lib/stats';
import { actions, useAppState, type VoiceMode } from '@/store/app-store';

export default function PracticeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const stage = useAppState((s) => s.stage);
  const stageSince = useAppState((s) => s.stageSince);
  const snoozedStage = useAppState((s) => s.snoozedStage);
  const settings = useAppState((s) => s.settings);
  const sessions = useAppState((s) => s.sessions);
  const seenIntro = useAppState((s) => s.seenIntro);

  const plan = buildSessionPlan(stage, settings);
  const exercise = EXERCISES[stage - 1];
  const next = EXERCISES[stage];
  const today = sessionsOn(sessions, new Date()).length;
  const readiness = stageReadiness(sessions, stage, stageSince);
  const suggestNext = readiness.ready && snoozedStage !== stage && next;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                hitSlop={12}
                style={{ paddingHorizontal: Spacing.xs }}>
                <Icon
                  name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
                  size={21}
                  color={theme.accent}
                />
              </Pressable>
            </Link>
          ),
        }}
      />
      <ScreenScroll>
        <View style={{ gap: Spacing.lg, paddingHorizontal: Spacing.xs, paddingTop: Spacing.sm }}>
          <View style={{ gap: Spacing.sm }}>
            <AppText variant="subhead" tone="secondary">
              Stage {stage} · {exercise.title}
            </AppText>
            <AppText variant="phrase" selectable>
              {exercise.formula}
            </AppText>
            <AppText variant="subhead" tone="secondary">
              {formatMinutes(planDurationSec(plan))}
              {` · ${stage} ${stage === 1 ? 'exercise' : 'exercises'}`}
            </AppText>
          </View>

          <Button
            label="Start session"
            onPress={() => {
              haptic.light();
              router.push('/session');
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              alignSelf: 'center',
            }}
            accessible
            accessibilityLabel={`${today} of ${DAILY_TARGET} sessions today`}>
            <DayPips count={today} filled={theme.accent} empty={theme.textTertiary} size={7} />
            <AppText variant="footnote" tone="secondary" numeric>
              {today === 0
                ? 'No sessions yet today'
                : today >= DAILY_TARGET
                  ? `${today} sessions today`
                  : `${today} of ${DAILY_TARGET} today`}
            </AppText>
          </View>
        </View>

        {suggestNext ? (
          <Group title="Ready for the next exercise">
            <View style={{ padding: ScreenInset, gap: Spacing.md }}>
              <AppText variant="subhead" tone="secondary">
                {exercise.title} has come clearly in {readiness.clearly} of your last{' '}
                {readiness.recent.length} sessions. Add {next.title.toLowerCase()} to your sessions?
              </AppText>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button
                  label={`Add ${next.title.toLowerCase()}`}
                  size="medium"
                  onPress={() => {
                    haptic.success();
                    actions.setStage(stage + 1);
                  }}
                />
                <Button
                  label="Not yet"
                  variant="plain"
                  size="medium"
                  onPress={() => actions.snoozeAdvance()}
                />
              </View>
            </View>
          </Group>
        ) : null}

        {!seenIntro ? (
          <Group title="How it works">
            <View style={{ padding: ScreenInset, gap: Spacing.md }}>
              <AppText variant="subhead">
                Sit or lie down somewhere quiet. Close your eyes and repeat each phrase silently,
                without trying to make anything happen. The bell tells you when to move on.
              </AppText>
              <AppText variant="footnote" tone="secondary">
                Practice two or three times a day and add one exercise about every week. Don’t
                practice while driving. If you have a heart condition, epilepsy or a serious mental
                health condition, check with a clinician first.
              </AppText>
              <Button
                label="Got it"
                variant="secondary"
                size="medium"
                style={{ alignSelf: 'flex-start' }}
                onPress={() => actions.dismissIntro()}
              />
            </View>
          </Group>
        ) : null}

        <Group title="This session" footer={sessionHint(settings.voice, settings.bell)}>
          {plan
            .filter((s) => s.kind !== 'return')
            .map((step) => (
              <Row
                key={step.key}
                icon={step.icon}
                iconMuted={step.kind === 'calm'}
                title={step.phrase}
                separatorInset={ICON_ROW_INSET}
                trailing={
                  <AppText variant="subhead" tone="tertiary" numeric>
                    {step.repetitions}×
                  </AppText>
                }
              />
            ))}
          <Row
            icon={RETURN_ICON}
            iconMuted
            title="Come back"
            detail="Arms firm, breathe deeply, eyes open"
            separatorInset={ICON_ROW_INSET}
          />
        </Group>
      </ScreenScroll>
    </>
  );
}

/** How the session will guide you, in the words of the current settings. */
function sessionHint(voice: VoiceMode, bell: boolean) {
  const cue = bell ? 'until the bell' : 'until the next phrase';
  if (voice === 'every')
    return `Each phrase is spoken at every repetition. Repeat it along silently ${cue}.`;
  if (voice === 'once')
    return `Each phrase is spoken once. Then repeat it to yourself silently ${cue}.`;
  return `Read each phrase, close your eyes and repeat it to yourself silently ${cue}.`;
}
