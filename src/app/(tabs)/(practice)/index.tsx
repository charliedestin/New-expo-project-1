import { Link, Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { DayPips } from '@/components/day-pips';
import { Group, ICON_ROW_INSET, Row } from '@/components/group';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen-scroll';
import { Motion, ScreenInset, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { fire } from '@/lib/feedback';
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
          {/* Keyed by stage: adding an exercise cross-fades to the new formula instead of cutting. */}
          <Animated.View
            key={stage}
            entering={FadeIn.duration(Motion.phrase)}
            style={{ gap: Spacing.sm }}>
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
          </Animated.View>

          <Button label="Start session" onPress={() => router.push('/session')} />

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
          <Animated.View
            entering={FadeIn.duration(Motion.enter)}
            exiting={FadeOut.duration(Motion.state)}>
            <Group title="Ready for the next exercise">
              <View style={{ padding: ScreenInset, gap: Spacing.md }}>
                <AppText variant="subhead" tone="secondary">
                  {exercise.title} has come clearly in {readiness.clearly} of your last{' '}
                  {readiness.recent.length} sessions. Add {next.title.toLowerCase()} to your
                  sessions?
                </AppText>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Button
                    label={`Add ${next.title.toLowerCase()}`}
                    size="medium"
                    onPress={() => {
                      fire('stageAdded');
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
          </Animated.View>
        ) : null}

        {!seenIntro ? (
          <Animated.View exiting={FadeOut.duration(Motion.state)}>
            <Group title="How it works">
              <View style={{ padding: ScreenInset, gap: Spacing.md }}>
                <AppText variant="subhead">
                  Sit or lie down somewhere quiet. Close your eyes and repeat each phrase silently,
                  without trying to make anything happen. A bell marks each new phrase, and a lower
                  bell tells you when to come back.
                </AppText>
                <AppText variant="footnote" tone="secondary">
                  Practice two or three times a day and add one exercise about every week. Don’t
                  practice while driving. If you have a heart condition, epilepsy or a serious
                  mental health condition, check with a clinician first.
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
          </Animated.View>
        ) : null}

        {/* Slides into place when a section above leaves or the session gains an exercise. */}
        <Animated.View layout={SECTION_REFLOW}>
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
        </Animated.View>
      </ScreenScroll>
    </>
  );
}

/** On-screen movement: ease-in-out, under 300 ms (expo-animation). */
const SECTION_REFLOW = LinearTransition.duration(Motion.enter).easing(
  Easing.bezier(0.77, 0, 0.175, 1),
);

/** How the session will guide you, in the words of the current settings. */
function sessionHint(voice: VoiceMode, bell: boolean) {
  if (!bell && voice === 'off')
    return 'With the bell and voice off the session is silent, so keep your eyes open to follow it. Turn either on in Settings.';
  const cue = bell ? 'until the bell' : 'until the next phrase';
  if (voice === 'every')
    return `Each phrase is spoken at every repetition. Repeat it along silently ${cue}.`;
  if (voice === 'once')
    return `Each phrase is spoken once. Then repeat it to yourself silently ${cue}.`;
  return `Read each phrase, close your eyes and repeat it to yourself silently ${cue}.`;
}
