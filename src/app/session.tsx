import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { BreathingOrb } from '@/components/breathing-orb';
import { Button, PressableScale } from '@/components/button';
import { CalmRating } from '@/components/calm-rating';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import {
  buildSessionPlan,
  formatMinutes,
  planDurationSec,
  type SessionStep,
} from '@/lib/session-plan';
import { currentStreak, formatShift } from '@/lib/stats';
import { actions, useAppState } from '@/store/app-store';

type Phase = 'checkin' | 'practice' | 'checkout' | 'done';

/** Sessions shorter than this are discarded when ended early. */
const MIN_SAVED_MS = 60_000;

export default function SessionScreen() {
  useKeepAwake();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stage = useAppState((s) => s.stage);
  const settings = useAppState((s) => s.settings);
  const sessions = useAppState((s) => s.sessions);

  // Freeze the plan when the session opens so settings changes can't reshuffle it mid-practice.
  const [plan] = useState(() => buildSessionPlan(stage, settings));
  const totalMs = planDurationSec(plan) * 1000;

  const [phase, setPhase] = useState<Phase>('checkin');
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(5);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Session clock: advances only while practicing and not paused, and finishes the practice.
  const elapsedRef = useRef(0);
  useEffect(() => {
    if (phase !== 'practice' || paused || confirmEnd) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      elapsedRef.current = Math.min(totalMs, elapsedRef.current + (now - last));
      last = now;
      setElapsedMs(elapsedRef.current);
      if (elapsedRef.current >= totalMs) {
        clearInterval(id);
        Speech.stop();
        haptic.success();
        setAfter(before);
        setPhase('checkout');
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, paused, confirmEnd, totalMs, before]);

  const position = useMemo(() => locate(plan, elapsedMs), [plan, elapsedMs]);
  const cueKey = `${position.stepIndex}:${position.rep}`;

  // One cue per repetition: speak the phrase; a soft tap when the phrase changes.
  const lastStep = useRef(-1);
  useEffect(() => {
    if (phase !== 'practice' || paused) return;
    const step = plan[position.stepIndex];
    if (settings.voice) {
      Speech.stop();
      Speech.speak(step.phrase, { rate: 0.8, pitch: 0.95 });
    }
    if (settings.haptics && lastStep.current !== position.stepIndex) haptic.soft();
    lastStep.current = position.stepIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cue only when the repetition changes
  }, [cueKey, phase]);

  useEffect(() => () => void Speech.stop(), []);

  // Android back during practice asks before ending, like the close button.
  useEffect(() => {
    if (phase !== 'practice') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirmEnd((c) => !c);
      return true;
    });
    return () => sub.remove();
  }, [phase]);

  const endEarly = () => {
    Speech.stop();
    setConfirmEnd(false);
    if (elapsedMs >= MIN_SAVED_MS) {
      setAfter(before);
      setPhase('checkout');
    } else {
      close();
    }
  };

  const save = () => {
    actions.addSession({
      endedAt: new Date().toISOString(),
      durationSec: Math.round(elapsedMs / 1000),
      stage,
      before,
      after,
    });
    haptic.success();
    setPhase('done');
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top + Spacing.two,
        paddingBottom: insets.bottom + Spacing.four,
        paddingHorizontal: Spacing.five,
      }}>
      <View style={{ flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
        {phase === 'checkin' && (
          <CheckIn
            title="How calm do you feel right now?"
            body="Get comfortable, sitting or lying down. Loosen anything tight. You can keep your eyes closed once you start."
            value={before}
            onChange={setBefore}
            actionLabel="Start"
            onAction={() => {
              haptic.light();
              setPhase('practice');
            }}
            meta={`${formatMinutes(totalMs / 1000)} · Stage ${stage}, ${EXERCISES[stage - 1].title}`}
            onClose={close}
          />
        )}

        {phase === 'practice' && (
          <Practice
            plan={plan}
            position={position}
            elapsedMs={elapsedMs}
            totalMs={totalMs}
            paused={paused}
            onTogglePause={() => {
              haptic.light();
              if (!paused) Speech.stop();
              setPaused((p) => !p);
            }}
            onClose={() => setConfirmEnd(true)}
          />
        )}

        {phase === 'checkout' && (
          <CheckIn
            title="How calm do you feel now?"
            body="Take a moment before you get up. Stretch, and notice how your body feels."
            value={after}
            onChange={setAfter}
            actionLabel="Save session"
            onAction={save}
            meta={`You started at ${before}`}
          />
        )}

        {phase === 'done' && (
          <Done
            before={before}
            after={after}
            minutes={Math.max(1, Math.round(elapsedMs / 60000))}
            streak={currentStreak(sessions)}
            onDone={close}
          />
        )}
      </View>

      {confirmEnd && (
        <EndConfirm
          canSave={elapsedMs >= MIN_SAVED_MS}
          onKeepGoing={() => setConfirmEnd(false)}
          onEnd={endEarly}
        />
      )}
    </View>
  );
}

function locate(plan: SessionStep[], elapsedMs: number) {
  let start = 0;
  for (let i = 0; i < plan.length; i++) {
    const repMs = plan[i].secondsPerRep * 1000;
    const stepMs = plan[i].repetitions * repMs;
    if (elapsedMs < start + stepMs || i === plan.length - 1) {
      const rep = Math.min(plan[i].repetitions - 1, Math.floor((elapsedMs - start) / repMs));
      return { stepIndex: i, rep: Math.max(0, rep) };
    }
    start += stepMs;
  }
  return { stepIndex: plan.length - 1, rep: 0 };
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function TopBar({ onClose, children }: { onClose?: () => void; children?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: Spacing.three }}>
      {onClose ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.surfaceMuted,
            opacity: pressed ? 0.6 : 1,
          })}>
          <Icon
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={16}
            color={theme.textSecondary}
            weight="semibold"
          />
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <View style={{ flex: 1, alignItems: 'center' }}>{children}</View>
      <View style={{ width: 40 }} />
    </View>
  );
}

function CheckIn(props: {
  title: string;
  body: string;
  value: number;
  onChange: (v: number) => void;
  actionLabel: string;
  onAction: () => void;
  meta: string;
  onClose?: () => void;
}) {
  return (
    <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
      <TopBar onClose={props.onClose}>
        <AppText variant="footnote" tone="secondary" numeric>
          {props.meta}
        </AppText>
      </TopBar>
      <View style={{ flex: 1, justifyContent: 'center', gap: Spacing.eight }}>
        <View style={{ gap: Spacing.three }}>
          <AppText variant="display" center>
            {props.title}
          </AppText>
          <AppText
            variant="callout"
            tone="secondary"
            center
            style={{ paddingHorizontal: Spacing.two }}>
            {props.body}
          </AppText>
        </View>
        <CalmRating value={props.value} onChange={props.onChange} />
      </View>
      <Button label={props.actionLabel} onPress={props.onAction} />
    </Animated.View>
  );
}

function Practice(props: {
  plan: SessionStep[];
  position: { stepIndex: number; rep: number };
  elapsedMs: number;
  totalMs: number;
  paused: boolean;
  onTogglePause: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { height, width } = useWindowDimensions();
  const step = props.plan[props.position.stepIndex];
  const orbSize = Math.min(width - Spacing.ten * 2, height * 0.34, 300);
  const progress = props.elapsedMs / props.totalMs;

  return (
    <View style={{ flex: 1 }}>
      <TopBar onClose={props.onClose}>
        <AppText variant="footnote" tone="secondary" numeric>
          {props.position.stepIndex + 1} of {props.plan.length}
        </AppText>
      </TopBar>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.eight }}>
        <BreathingOrb size={orbSize} paused={props.paused} />

        <Animated.View
          key={step.key}
          entering={FadeIn.duration(700)}
          exiting={FadeOut.duration(300)}
          style={{ alignItems: 'center', gap: Spacing.three, minHeight: 130 }}>
          <AppText variant="caption" tone="accent">
            {step.title}
          </AppText>
          <AppText variant="display" center accessibilityLiveRegion="polite">
            {step.phrase}
          </AppText>
          {step.repetitions > 1 ? (
            <View
              style={{ flexDirection: 'row', gap: 6, marginTop: Spacing.one }}
              accessible
              accessibilityLabel={`Repetition ${props.position.rep + 1} of ${step.repetitions}`}>
              {Array.from({ length: step.repetitions }, (_, i) => (
                <View
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i <= props.position.rep ? theme.accent : theme.separator,
                  }}
                />
              ))}
            </View>
          ) : null}
        </Animated.View>
      </View>

      <View style={{ gap: Spacing.five }}>
        <View style={{ gap: Spacing.two }}>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.surfaceMuted,
              overflow: 'hidden',
            }}>
            <View
              style={{
                height: 4,
                width: `${Math.min(100, progress * 100)}%`,
                backgroundColor: theme.accent,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="footnote" tone="tertiary" numeric>
              {formatClock(props.elapsedMs)}
            </AppText>
            <AppText variant="footnote" tone="tertiary" numeric>
              −{formatClock(props.totalMs - props.elapsedMs)}
            </AppText>
          </View>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={props.paused ? 'Resume' : 'Pause'}
          onPress={props.onTogglePause}
          style={{
            alignSelf: 'center',
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: props.paused ? theme.accent : theme.accentSoft,
          }}>
          <Icon
            name={
              props.paused
                ? { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                : { ios: 'pause.fill', android: 'pause', web: 'pause' }
            }
            size={28}
            color={props.paused ? theme.onAccent : theme.accent}
          />
        </PressableScale>
      </View>
    </View>
  );
}

function EndConfirm(props: { canSave: boolean; onKeepGoing: () => void; onEnd: () => void }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'center',
        padding: Spacing.six,
      }}>
      <Card
        style={{
          gap: Spacing.four,
          padding: Spacing.six,
          maxWidth: 420,
          alignSelf: 'center',
          width: '100%',
        }}>
        <View style={{ gap: Spacing.two }}>
          <AppText variant="title">End this session?</AppText>
          <AppText variant="callout" tone="secondary">
            {props.canSave
              ? 'Come back slowly first: press your arms firm, take a deep breath, and open your eyes.'
              : 'Sessions under a minute aren’t saved. Come back slowly before you get up.'}
          </AppText>
        </View>
        <Button label="Keep going" onPress={props.onKeepGoing} />
        <Pressable
          accessibilityRole="button"
          onPress={props.onEnd}
          style={({ pressed }) => ({
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: Radius.pill,
            backgroundColor: pressed ? theme.surfaceMuted : 'transparent',
          })}>
          <AppText variant="headline" tone="secondary">
            End session
          </AppText>
        </Pressable>
      </Card>
    </Animated.View>
  );
}

function Done(props: {
  before: number;
  after: number;
  minutes: number;
  streak: number;
  onDone: () => void;
}) {
  const theme = useTheme();
  const shift = props.after - props.before;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.six }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accentSoft,
          }}>
          <Icon
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={40}
            color={theme.accent}
            weight="semibold"
          />
        </View>
        <View style={{ gap: Spacing.two, alignItems: 'center' }}>
          <AppText variant="display" center>
            Session complete
          </AppText>
          <AppText variant="callout" tone="secondary" center>
            {shift > 0
              ? 'You’re leaving calmer than you arrived.'
              : 'Every session counts, even the restless ones.'}
          </AppText>
        </View>
        <Card style={{ flexDirection: 'row', alignSelf: 'stretch', padding: 0 }}>
          <Summary label="Calm" value={`${props.before} → ${props.after}`} />
          <Summary
            label="Change"
            value={shift === 0 ? '0' : formatShift(shift)}
            accent={shift > 0}
            divider
          />
          <Summary label="Minutes" value={String(props.minutes)} divider />
        </Card>
        {props.streak > 1 ? (
          <AppText variant="footnote" tone="secondary" numeric>
            {props.streak}-day streak
          </AppText>
        ) : null}
      </View>
      <Button label="Done" onPress={props.onDone} />
    </Animated.View>
  );
}

function Summary({
  label,
  value,
  accent,
  divider,
}: {
  label: string;
  value: string;
  accent?: boolean;
  divider?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: Spacing.five,
        borderLeftWidth: divider ? 1 : 0,
        borderLeftColor: theme.separator,
      }}>
      <AppText variant="title" numeric tone={accent ? 'accent' : 'primary'} selectable>
        {value}
      </AppText>
      <AppText variant="footnote" tone="secondary">
        {label}
      </AppText>
    </View>
  );
}
