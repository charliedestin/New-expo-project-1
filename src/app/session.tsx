import { Host, Switch } from '@expo/ui';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import Animated, { cubicBezier, FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { CalmScale } from '@/components/calm-scale';
import { Icon } from '@/components/icon';
import { MaxContentWidth, Motion, Radius, SessionPalette as P, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import {
  buildSessionPlan,
  formatMinutes,
  planDurationSec,
  type SessionStep,
} from '@/lib/session-plan';
import { FELT_LABEL, stageReadiness } from '@/lib/stats';
import { useBells } from '@/lib/use-bells';
import { actions, useAppState, type Felt } from '@/store/app-store';

type Phase = 'checkin' | 'practice' | 'checkout' | 'done' | 'asleep';

const KEEP_AWAKE = 'autogenic-session';
/** Sessions shorter than this are discarded when ended early. */
const MIN_SAVED_MS = 60_000;
const CONTROLS_HIDE_MS = 4000;
/** Let the bell ring out a little before the voice starts. */
const VOICE_AFTER_BELL_MS = 1800;
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/** What each exercise asks you to notice, for the check-out question. */
const SENSATION: Record<string, string> = {
  heaviness: 'the heaviness',
  warmth: 'the warmth',
  heartbeat: 'a calm heartbeat',
  breathing: 'easy breathing',
  abdomen: 'the warmth in your stomach',
  forehead: 'the coolness on your forehead',
};

export default function SessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bells = useBells();
  const stage = useAppState((s) => s.stage);
  const stageSince = useAppState((s) => s.stageSince);
  const settings = useAppState((s) => s.settings);
  const sessions = useAppState((s) => s.sessions);
  const exercise = EXERCISES[stage - 1];

  const [phase, setPhase] = useState<Phase>('checkin');
  const [bedtime, setBedtime] = useState(false);
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(5);
  const [felt, setFelt] = useState<Felt | null>(null);
  // The plan is frozen when practice begins, so settings changes can't reshuffle a running session.
  const [plan, setPlan] = useState<SessionStep[] | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [voiceId, setVoiceId] = useState<string>();

  const preview = useMemo(
    () => buildSessionPlan(stage, settings, { bedtime }),
    [stage, settings, bedtime],
  );
  const totalMs = (plan ? planDurationSec(plan) : planDurationSec(preview)) * 1000;
  const elapsedRef = useRef(0);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = (values: { after: number | null; felt: Felt | null }) =>
    actions.addSession({
      endedAt: new Date().toISOString(),
      durationSec: Math.round(elapsedRef.current / 1000),
      stage,
      before,
      bedtime,
      ...values,
    });

  // The screen stays on for the session, and is released the moment it ends.
  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE).catch(() => {});
      Speech.stop();
    };
  }, []);

  // Prefer the device's enhanced-quality voice over the default compact one.
  useEffect(() => {
    const lang = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2);
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const matching = voices.filter((v) => v.language?.startsWith(lang));
        const best =
          matching.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ?? matching[0];
        if (best) setVoiceId(best.identifier);
      })
      .catch(() => {});
  }, []);

  // Session clock: runs only while practicing and not paused, and finishes the practice.
  useEffect(() => {
    if (phase !== 'practice' || paused || !plan) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      elapsedRef.current = Math.min(totalMs, elapsedRef.current + (now - last));
      last = now;
      setElapsedMs(elapsedRef.current);
      if (elapsedRef.current < totalMs) return;
      clearInterval(id);
      Speech.stop();
      if (bedtime) {
        // Before sleep: no bell, no questions. Save quietly and let the phone sleep.
        save({ after: null, felt: null });
        deactivateKeepAwake(KEEP_AWAKE).catch(() => {});
        setPhase('asleep');
      } else {
        if (settings.bell) bells.close();
        setAfter(before);
        setPhase('checkout');
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the rest is fixed for the session
  }, [phase, paused, plan, totalMs]);

  const position = useMemo(
    () => (plan ? locate(plan, elapsedMs) : { stepIndex: 0, rep: 0 }),
    [plan, elapsedMs],
  );
  const cueKey = `${position.stepIndex}:${position.rep}`;

  // Cues, once per repetition: a bell for each new phrase, then the voice (if on).
  const lastStep = useRef(-1);
  useEffect(() => {
    if (phase !== 'practice' || paused || !plan) return;
    const step = plan[position.stepIndex];
    const isNewStep = lastStep.current !== position.stepIndex;
    lastStep.current = position.stepIndex;

    let delay = 0;
    if (isNewStep && settings.bell && step.kind !== 'return') {
      if (position.stepIndex === 0) bells.open();
      else bells.next();
      delay = VOICE_AFTER_BELL_MS;
    }
    if (isNewStep && settings.haptics) haptic.soft();

    const speak =
      settings.voice === 'every' ||
      (settings.voice === 'once' && (position.rep === 0 || step.kind === 'return'));
    if (!speak) return;
    const t = setTimeout(
      () => Speech.speak(step.phrase, { rate: 0.82, pitch: 0.96, voice: voiceId }),
      delay,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cue only when the repetition changes
  }, [cueKey, phase, paused, plan]);

  // Controls fade away while practicing; a tap brings them back.
  const [touchTick, setTouchTick] = useState(0);
  useEffect(() => {
    if (phase !== 'practice' || paused || !controlsVisible) return;
    const t = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
    return () => clearTimeout(t);
  }, [phase, paused, controlsVisible, touchTick]);

  const begin = () => {
    haptic.light();
    elapsedRef.current = 0;
    lastStep.current = -1;
    setElapsedMs(0);
    setPlan(buildSessionPlan(stage, settings, { bedtime }));
    setControlsVisible(true);
    setPhase('practice');
  };

  const requestEnd = async () => {
    const wasPaused = paused;
    setPaused(true);
    Speech.stop();
    const canSave = elapsedRef.current >= MIN_SAVED_MS;
    const ok = await confirm({
      title: 'End this session?',
      message: canSave
        ? 'Come back slowly first: arms firm, a deep breath, then open your eyes. What you’ve done so far is kept.'
        : 'Sessions shorter than a minute aren’t kept.',
      confirmLabel: 'End session',
      cancelLabel: 'Keep going',
    });
    if (!ok) {
      setPaused(wasPaused);
      setTouchTick((t) => t + 1);
      return;
    }
    if (!canSave) return close();
    if (bedtime) {
      save({ after: null, felt: null });
      return close();
    }
    setAfter(before);
    setPaused(false);
    setPhase('checkout');
  };

  const saveCheckout = () => {
    save({ after, felt });
    haptic.success();
    setPhase('done');
  };

  // Android back: asks before ending a practice; saves from the check-out.
  useEffect(() => {
    if (phase !== 'practice' && phase !== 'checkout') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'practice') requestEnd();
      else {
        save({ after, felt });
        close();
      }
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, after, felt, paused]);

  const readinessNow = stageReadiness(sessions, stage, stageSince);

  return (
    <View style={{ flex: 1, backgroundColor: P.background }}>
      <StatusBar style="light" hidden={phase === 'practice' && !controlsVisible} animated />

      {phase === 'checkin' && (
        <Screen insets={insets}>
          <TopBar onClose={close}>
            {formatMinutes(totalMs / 1000)} · {exercise.title}
          </TopBar>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              gap: Spacing.section,
              paddingVertical: Spacing.xl,
            }}>
            <View style={{ gap: Spacing.sm }}>
              <AppText variant="title" center color={P.text}>
                How calm do you feel?
              </AppText>
              <AppText variant="subhead" center color={P.textSecondary}>
                Sit or lie down and loosen anything tight.
              </AppText>
            </View>
            <CalmScale value={before} onChange={setBefore} />
            <View
              style={{
                backgroundColor: P.fill,
                borderRadius: Radius.group,
                borderCurve: 'continuous',
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                gap: 2,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  minHeight: 36,
                }}>
                <AppText variant="body" color={P.text} style={{ flex: 1 }}>
                  Before sleep
                </AppText>
                <Host matchContents colorScheme="dark" seedColor={P.accent}>
                  <Switch value={bedtime} onValueChange={setBedtime} testID="bedtime-switch" />
                </Host>
              </View>
              <AppText variant="footnote" color={P.textSecondary}>
                Leaves out coming back, so you can drift off. The session ends without a bell.
              </AppText>
            </View>
          </ScrollView>
          <Button
            label="Begin"
            colors={{ background: P.accent, foreground: P.onAccent }}
            onPress={begin}
          />
        </Screen>
      )}

      {phase === 'practice' && plan && (
        <Practice
          plan={plan}
          position={position}
          elapsedMs={elapsedMs}
          totalMs={totalMs}
          paused={paused}
          controlsVisible={controlsVisible}
          insets={insets}
          onSurfaceTap={() => {
            setControlsVisible((v) => !v);
            setTouchTick((t) => t + 1);
          }}
          onTogglePause={() => {
            haptic.light();
            if (!paused) Speech.stop();
            setPaused((p) => !p);
            setTouchTick((t) => t + 1);
          }}
          onClose={requestEnd}
        />
      )}

      {phase === 'checkout' && (
        <Screen insets={insets}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              gap: Spacing.section,
              paddingVertical: Spacing.xl,
            }}>
            <View style={{ gap: Spacing.sm }}>
              <AppText variant="title" center color={P.text}>
                How calm do you feel now?
              </AppText>
              <AppText variant="subhead" center color={P.textSecondary}>
                You started at {before}. Stretch before you get up.
              </AppText>
            </View>
            <CalmScale value={after} onChange={setAfter} />
            <View style={{ gap: Spacing.sm }}>
              <AppText variant="headline" color={P.text} style={{ paddingHorizontal: Spacing.xs }}>
                Did {SENSATION[exercise.id] ?? 'the feeling'} come?
              </AppText>
              <Choice<Felt>
                value={felt}
                onChange={(f) => {
                  haptic.selection();
                  setFelt(f);
                }}
                options={(['clearly', 'somewhat', 'not-yet'] as const).map((f) => ({
                  value: f,
                  label: FELT_LABEL[f],
                }))}
              />
            </View>
          </ScrollView>
          <Button
            label="Save"
            colors={{ background: P.accent, foreground: P.onAccent }}
            onPress={saveCheckout}
          />
        </Screen>
      )}

      {phase === 'done' && (
        <Screen insets={insets}>
          <Animated.View
            entering={FadeIn.duration(Motion.enter)}
            style={{ flex: 1, justifyContent: 'center', gap: Spacing.md }}>
            <AppText variant="title" center color={P.text}>
              Session saved
            </AppText>
            <AppText variant="subhead" center numeric color={P.textSecondary}>
              Calm {before} → {after} · {formatMinutes(elapsedMs / 1000)}
            </AppText>
            <AppText
              variant="subhead"
              center
              color={P.textSecondary}
              style={{ paddingHorizontal: Spacing.lg }}>
              {felt === 'not-yet'
                ? 'That’s normal in the first days. The sensations come with repetition, not effort.'
                : readinessNow.ready && EXERCISES[stage]
                  ? `You’re ready to add ${EXERCISES[stage].title.toLowerCase()}. You’ll find it on the Practice tab.`
                  : null}
            </AppText>
          </Animated.View>
          <Button
            label="Done"
            colors={{ background: P.accent, foreground: P.onAccent }}
            onPress={close}
          />
        </Screen>
      )}

      {phase === 'asleep' && <Asleep insets={insets} onDone={close} />}
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

/** One segment per step, sized by its share of the session, filled by elapsed time. */
function segmentsFor(plan: SessionStep[], elapsedMs: number) {
  const segments: { key: string; ms: number; fill: number }[] = [];
  let start = 0;
  for (const s of plan) {
    const ms = s.repetitions * s.secondsPerRep * 1000;
    segments.push({ key: s.key, ms, fill: Math.min(1, Math.max(0, (elapsedMs - start) / ms)) });
    start += ms;
  }
  return segments;
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type Insets = { top: number; bottom: number };

function Screen({ insets, children }: { insets: Insets; children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + Spacing.sm,
        paddingBottom: insets.bottom + Spacing.lg,
        paddingHorizontal: Spacing.xl,
      }}>
      <View style={{ flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
        {children}
      </View>
    </View>
  );
}

function CircleButton({
  label,
  onPress,
  children,
  size = 36,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={(44 - Math.min(size, 44)) / 2}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: P.fill,
        opacity: pressed ? 0.6 : 1,
      })}>
      {children}
    </Pressable>
  );
}

const CLOSE_ICON = { ios: 'xmark', android: 'close', web: 'close' } as const;

function TopBar({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: Spacing.md }}>
      <CircleButton label="Close" onPress={onClose}>
        <Icon name={CLOSE_ICON} size={14} weight="semibold" color={P.textSecondary} />
      </CircleButton>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <AppText variant="footnote" numeric color={P.textSecondary}>
          {children}
        </AppText>
      </View>
      <View style={{ width: 36 }} />
    </View>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        backgroundColor: P.fill,
        borderRadius: Radius.group,
        borderCurve: 'continuous',
        overflow: 'hidden',
      }}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 48,
              paddingHorizontal: Spacing.lg,
              borderTopWidth: i > 0 ? 0.5 : 0,
              borderTopColor: P.track,
              backgroundColor: pressed ? P.fill : 'transparent',
            })}>
            <AppText variant="body" color={P.text} style={{ flex: 1 }}>
              {o.label}
            </AppText>
            {selected ? (
              <Icon
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={16}
                weight="semibold"
                color={P.accent}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function Practice(props: {
  plan: SessionStep[];
  position: { stepIndex: number; rep: number };
  elapsedMs: number;
  totalMs: number;
  paused: boolean;
  controlsVisible: boolean;
  insets: Insets;
  onSurfaceTap: () => void;
  onTogglePause: () => void;
  onClose: () => void;
}) {
  const step = props.plan[props.position.stepIndex];
  const visible = props.controlsVisible || props.paused;
  const fade = {
    opacity: visible ? 1 : 0,
    transitionProperty: 'opacity' as const,
    transitionDuration: visible ? Motion.state : 600,
    transitionTimingFunction: EASE_OUT,
  };

  const segments = segmentsFor(props.plan, props.elapsedMs);

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={props.onSurfaceTap}
      accessible={false}
      accessibilityHint="Shows or hides the controls">
      <View
        style={{
          flex: 1,
          paddingTop: props.insets.top + Spacing.sm,
          paddingBottom: props.insets.bottom + Spacing.lg,
          paddingHorizontal: Spacing.xl,
        }}>
        <Animated.View
          style={[{ gap: Spacing.md }, fade]}
          pointerEvents={visible ? 'box-none' : 'none'}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: Spacing.md }}>
            <CircleButton label="End session" onPress={props.onClose}>
              <Icon name={CLOSE_ICON} size={14} weight="semibold" color={P.textSecondary} />
            </CircleButton>
            <View style={{ flex: 1, flexDirection: 'row', gap: 3 }}>
              {segments.map((s) => (
                <View
                  key={s.key}
                  style={{
                    flex: s.ms,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: P.track,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${s.fill * 100}%`,
                      backgroundColor: P.text,
                      opacity: 0.85,
                    }}
                  />
                </View>
              ))}
            </View>
            <AppText
              variant="footnote"
              numeric
              color={P.textSecondary}
              style={{ minWidth: 36, textAlign: 'right' }}>
              {formatClock(props.totalMs - props.elapsedMs)}
            </AppText>
          </View>
        </Animated.View>

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            width: '100%',
            maxWidth: MaxContentWidth,
            alignSelf: 'center',
          }}>
          <Animated.View
            key={step.key}
            entering={FadeIn.duration(Motion.phrase)}
            exiting={FadeOut.duration(Motion.enter)}
            style={{ alignItems: 'center', gap: Spacing.lg }}>
            <AppText variant="subhead" color={P.accent}>
              {step.title}
            </AppText>
            <AppText
              variant="phrase"
              center
              color={P.text}
              style={{ fontSize: 34, lineHeight: 42 }}
              accessibilityLiveRegion="polite">
              {step.phrase}
            </AppText>
            {step.repetitions > 1 ? (
              <View
                style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}
                accessible
                accessibilityLabel={`Repetition ${props.position.rep + 1} of ${step.repetitions}`}>
                {Array.from({ length: step.repetitions }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i <= props.position.rep ? P.textSecondary : P.track,
                    }}
                  />
                ))}
              </View>
            ) : null}
          </Animated.View>
        </View>

        <Animated.View
          style={[{ alignItems: 'center', gap: Spacing.sm }, fade]}
          pointerEvents={visible ? 'box-none' : 'none'}>
          <CircleButton
            label={props.paused ? 'Resume' : 'Pause'}
            onPress={props.onTogglePause}
            size={64}>
            <Icon
              name={
                props.paused
                  ? { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                  : { ios: 'pause.fill', android: 'pause', web: 'pause' }
              }
              size={24}
              color={P.text}
            />
          </CircleButton>
          <AppText variant="footnote" color={P.textTertiary}>
            {props.paused ? 'Paused' : 'Tap anywhere to hide'}
          </AppText>
        </Animated.View>
      </View>
    </Pressable>
  );
}

function Asleep({ insets, onDone }: { insets: Insets; onDone: () => void }) {
  const [showDone, setShowDone] = useState(false);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFaded(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Pressable
      style={{ flex: 1, backgroundColor: '#000' }}
      onPress={() => setShowDone(true)}
      accessibilityHint="Shows the Done button">
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingBottom: insets.bottom + Spacing.lg,
          paddingTop: insets.top,
        }}>
        <Animated.View
          style={{
            opacity: faded && !showDone ? 0 : 1,
            transitionProperty: 'opacity',
            transitionDuration: 2000,
            gap: Spacing.sm,
          }}>
          <AppText variant="title" center color={P.textSecondary}>
            Sleep well
          </AppText>
          <AppText variant="footnote" center color={P.textTertiary}>
            Your session is saved.
          </AppText>
        </Animated.View>
      </View>
      {showDone ? (
        <View
          style={{
            position: 'absolute',
            left: Spacing.xl,
            right: Spacing.xl,
            bottom: insets.bottom + Spacing.lg,
          }}>
          <Button
            label="Done"
            colors={{ background: P.fill as string, foreground: P.text }}
            onPress={onDone}
          />
        </View>
      ) : null}
    </Pressable>
  );
}
