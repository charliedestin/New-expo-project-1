import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { ScreenScroll, SectionHeader } from '@/components/screen-scroll';
import { Radius, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';
import { currentStreak, format, formatShift, lastSevenDays, totals } from '@/lib/stats';
import { useAppState, type SessionRecord } from '@/store/app-store';

const RECENT_LIMIT = 20;

export default function ProgressScreen() {
  const sessions = useAppState((s) => s.sessions);

  if (sessions.length === 0) return <EmptyProgress />;

  const { count, minutes, avgShift } = totals(sessions);
  const streak = currentStreak(sessions);
  const week = lastSevenDays(sessions);

  return (
    <ScreenScroll>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three }}>
        <Stat label="Sessions" value={String(count)} />
        <Stat label="Minutes" value={String(minutes)} />
        <Stat label="Streak" value={String(streak)} unit={streak === 1 ? 'day' : 'days'} />
        <Stat
          label="Avg. calm change"
          value={avgShift === null ? '–' : formatShift(avgShift)}
          accent={avgShift !== null && avgShift > 0}
        />
      </View>

      <WeekChart days={week} />

      <SectionHeader>
        <AppText variant="caption" tone="tertiary">
          Recent sessions
        </AppText>
      </SectionHeader>
      <Card padded={false}>
        {sessions.slice(0, RECENT_LIMIT).map((session, i) => (
          <SessionRow key={session.id} session={session} divider={i > 0} />
        ))}
      </Card>
    </ScreenScroll>
  );
}

function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <Card style={{ flexGrow: 1, flexBasis: '45%', gap: Spacing.one, padding: Spacing.five }}>
      <AppText variant="footnote" tone="secondary">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <AppText variant="stat" tone={accent ? 'accent' : 'primary'} numeric selectable>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="callout" tone="secondary">
            {unit}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

function WeekChart({ days }: { days: ReturnType<typeof lastSevenDays> }) {
  const theme = useTheme();
  const max = Math.max(10, ...days.map((d) => d.minutes));
  const BAR_AREA = 120;

  return (
    <Card style={{ gap: Spacing.four }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AppText variant="headline">Last 7 days</AppText>
        <AppText variant="footnote" tone="secondary" numeric>
          {days.reduce((s, d) => s + d.minutes, 0)} min
        </AppText>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, height: BAR_AREA }}
        accessible
        accessibilityLabel={days
          .map((d) => `${format.weekday(d.date)}: ${d.minutes} minutes`)
          .join(', ')}>
        {days.map((d) => (
          <View
            key={d.date.toISOString()}
            style={{ flex: 1, alignItems: 'center', gap: Spacing.one }}>
            {d.minutes > 0 ? (
              <AppText variant="footnote" tone="secondary" numeric style={{ fontSize: 11 }}>
                {d.minutes}
              </AppText>
            ) : null}
            <View
              style={{
                width: '100%',
                maxWidth: 28,
                height: Math.max(4, (d.minutes / max) * (BAR_AREA - 24)),
                borderRadius: 6,
                borderCurve: 'continuous',
                backgroundColor: d.minutes > 0 ? theme.accent : theme.surfaceMuted,
                opacity: d.minutes > 0 && !d.isToday ? 0.55 : 1,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        {days.map((d) => (
          <AppText
            key={d.date.toISOString()}
            variant="footnote"
            tone={d.isToday ? 'primary' : 'tertiary'}
            center
            style={{ flex: 1, fontSize: 11, fontWeight: d.isToday ? '600' : '400' }}>
            {format.weekday(d.date)}
          </AppText>
        ))}
      </View>
    </Card>
  );
}

function SessionRow({ session, divider }: { session: SessionRecord; divider: boolean }) {
  const theme = useTheme();
  const ended = new Date(session.endedAt);
  const shift = session.after - session.before;
  const exercise = EXERCISES[session.stage - 1];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.five,
        minHeight: 64,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: theme.separator,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{format.date(ended)}</AppText>
        <AppText variant="footnote" tone="secondary" numeric>
          {format.time(ended)} · {Math.max(1, Math.round(session.durationSec / 60))} min · Stage{' '}
          {session.stage}, {exercise?.title ?? ''}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <AppText variant="headline" numeric selectable>
          {session.before} → {session.after}
        </AppText>
        <AppText
          variant="footnote"
          numeric
          tone={shift > 0 ? 'accent' : 'tertiary'}
          style={{ fontWeight: '600' }}>
          {shift === 0 ? 'No change' : `${formatShift(shift)} calm`}
        </AppText>
      </View>
    </View>
  );
}

function EmptyProgress() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScreenScroll contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: Spacing.four, paddingVertical: Spacing.ten }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: Radius.card,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accentSoft,
          }}>
          <Icon
            name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
            size={32}
            color={theme.accent}
          />
        </View>
        <AppText variant="title" center>
          No sessions yet
        </AppText>
        <AppText variant="callout" tone="secondary" center style={{ maxWidth: 300 }}>
          Finish your first session and you’ll see your streak, minutes and how much calmer each one
          leaves you.
        </AppText>
        <Button
          label="Begin session"
          icon={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
          style={{ marginTop: Spacing.two, alignSelf: 'stretch' }}
          onPress={() => router.push('/session')}
        />
      </View>
    </ScreenScroll>
  );
}
