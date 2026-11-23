import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { DayPips } from '@/components/day-pips';
import { Group, Row } from '@/components/group';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen-scroll';
import { ScreenInset, Spacing } from '@/constants/theme';
import { EXERCISES, MAX_STAGE } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import {
  currentStreak,
  FELT_LABEL,
  format,
  formatDuration,
  lastSevenDays,
  relativeDay,
  stageReadiness,
  type Readiness,
} from '@/lib/stats';
import { useAppState, type Felt, type SessionRecord } from '@/store/app-store';

const HISTORY_LIMIT = 30;

export default function ProgressScreen() {
  const sessions = useAppState((s) => s.sessions);
  const stage = useAppState((s) => s.stage);
  const stageSince = useAppState((s) => s.stageSince);

  if (sessions.length === 0) return <EmptyProgress />;

  const week = lastSevenDays(sessions);
  const weekCount = week.reduce((sum, d) => sum + d.count, 0);
  const readiness = stageReadiness(sessions, stage, stageSince);
  const totalSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
  const streak = currentStreak(sessions);

  return (
    <ScreenScroll>
      <Group title="This week" detail={`${weekCount} ${weekCount === 1 ? 'session' : 'sessions'}`}>
        <WeekStrip days={week} />
      </Group>

      <Group title={EXERCISES[stage - 1].title}>
        <StageProgress stage={stage} readiness={readiness} />
      </Group>

      <Group
        title="History"
        footer={`${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} · ${formatDuration(totalSec)} in total${streak > 1 ? ` · ${streak}-day streak` : ''}`}>
        {sessions.slice(0, HISTORY_LIMIT).map((s) => (
          <HistoryRow key={s.id} session={s} />
        ))}
      </Group>
    </ScreenScroll>
  );
}

function WeekStrip({ days }: { days: ReturnType<typeof lastSevenDays> }) {
  const theme = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingVertical: ScreenInset }}
      accessible
      accessibilityLabel={days.map((d) => `${format.weekday(d.date)}: ${d.count}`).join(', ')}>
      {days.map((d) => (
        <View key={d.date.toISOString()} style={{ flex: 1, alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ height: 34, justifyContent: 'flex-end' }}>
            <DayPips
              count={d.count}
              direction="column"
              filled={theme.accent}
              empty={theme.separator}
              size={8}
            />
          </View>
          <AppText
            variant="footnote"
            tone={d.isToday ? 'primary' : 'tertiary'}
            weight={d.isToday ? '600' : '400'}>
            {format.narrowDay(d.date)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function FeltMark({ felt }: { felt: Felt | null }) {
  const theme = useTheme();
  const size = 12;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor:
          felt === 'clearly'
            ? theme.accent
            : felt === 'somewhat'
              ? theme.accentSoft
              : 'transparent',
        borderWidth: felt === 'clearly' ? 0 : 1.5,
        borderColor: felt === 'somewhat' ? theme.accent : theme.separator,
      }}
    />
  );
}

function StageProgress({ stage, readiness }: { stage: number; readiness: Readiness }) {
  const exercise = EXERCISES[stage - 1];
  const next = EXERCISES[stage];
  const { recent, clearly } = readiness;

  let summary: string;
  if (recent.length === 0) {
    summary = `After each session you’ll note how clearly the ${exercise.title.toLowerCase()} came. That tells you when to move on.`;
  } else if (readiness.ready && next) {
    summary = `It came clearly in ${clearly} of your last ${recent.length} sessions. You’re ready to add ${next.title.toLowerCase()}.`;
  } else if (stage === MAX_STAGE && clearly >= 3) {
    summary = 'You’ve learned all six exercises. Keep practicing the full sequence.';
  } else {
    summary = `It came clearly in ${clearly} of your last ${recent.length} ${recent.length === 1 ? 'session' : 'sessions'}. There’s no rush; it usually takes about a week.`;
  }

  return (
    <View style={{ padding: ScreenInset, gap: Spacing.md }}>
      <View
        style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}
        accessible
        accessibilityLabel={`Last sessions: ${recent.map((f) => (f ? FELT_LABEL[f] : 'not noted')).join(', ') || 'none'}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <FeltMark key={i} felt={recent[recent.length - 1 - i] ?? null} />
        ))}
        <AppText variant="footnote" tone="secondary" numeric style={{ marginLeft: Spacing.xs }}>
          Day {readiness.daysAtStage} · {readiness.practiceDays} practice{' '}
          {readiness.practiceDays === 1 ? 'day' : 'days'}
        </AppText>
      </View>
      <AppText variant="subhead">{summary}</AppText>
    </View>
  );
}

function HistoryRow({ session }: { session: SessionRecord }) {
  const theme = useTheme();
  const ended = new Date(session.endedAt);
  const exercise = EXERCISES[session.stage - 1];
  const parts = [
    exercise?.title ?? `Stage ${session.stage}`,
    formatDuration(session.durationSec),
    session.bedtime
      ? 'Before sleep'
      : session.felt
        ? `Felt it: ${FELT_LABEL[session.felt].toLowerCase()}`
        : null,
  ].filter(Boolean);

  return (
    <Row
      title={`${relativeDay(ended)}, ${format.time(ended)}`}
      detail={parts.join(' · ')}
      trailing={
        session.after === null ? (
          <Icon
            name={{ ios: 'moon', android: 'bedtime', web: 'bedtime' }}
            size={16}
            color={theme.textTertiary}
          />
        ) : (
          <AppText variant="subhead" tone="secondary" numeric>
            {session.before} → {session.after}
          </AppText>
        )
      }
    />
  );
}

function EmptyProgress() {
  const router = useRouter();

  return (
    <ScreenScroll contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.section }}>
        <AppText variant="title" center>
          No sessions yet
        </AppText>
        <AppText variant="subhead" tone="secondary" center style={{ maxWidth: 300 }}>
          Your week, your practice diary and how calm each session leaves you will show up here.
        </AppText>
        <Button
          label="Start session"
          size="medium"
          variant="secondary"
          style={{ marginTop: Spacing.md }}
          onPress={() => router.push('/session')}
        />
      </View>
    </ScreenScroll>
  );
}
