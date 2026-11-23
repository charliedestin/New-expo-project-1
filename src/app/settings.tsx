import { Host, Picker, Switch } from '@expo/ui';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';
import { actions, useAppState, type Pace } from '@/store/app-store';

const supportsHaptics = process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android';

export default function SettingsScreen() {
  const theme = useTheme();
  const settings = useAppState((s) => s.settings);
  const stage = useAppState((s) => s.stage);
  const sessionCount = useAppState((s) => s.sessions.length);
  const [confirmReset, setConfirmReset] = useState(false);
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              style={{ paddingHorizontal: Spacing.two }}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
              <AppText variant="headline" tone="accent">
                Done
              </AppText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{
          padding: Spacing.five,
          paddingBottom: Spacing.ten,
        }}>
        <View
          style={{
            width: '100%',
            maxWidth: MaxContentWidth,
            alignSelf: 'center',
            gap: Spacing.six,
          }}>
          <Group title="Guidance">
            <Row label="Voice guidance" detail="Speaks each phrase aloud.">
              <Switch
                value={settings.voice}
                onValueChange={(voice) => actions.updateSettings({ voice })}
              />
            </Row>
            {supportsHaptics && (
              <Row label="Gentle taps" detail="A soft tap when the phrase changes." divider>
                <Switch
                  value={settings.haptics}
                  onValueChange={(hapticsOn) => actions.updateSettings({ haptics: hapticsOn })}
                />
              </Row>
            )}
          </Group>

          <Group title="Session">
            <Row label="Stage">
              <Picker
                selectedValue={stage}
                onValueChange={(value) => {
                  haptic.selection();
                  actions.setStage(Number(value));
                }}>
                {EXERCISES.map((e) => (
                  <Picker.Item key={e.id} label={`${e.stage}. ${e.title}`} value={e.stage} />
                ))}
              </Picker>
            </Row>
            <Row label="Repetitions" detail="How many times each phrase is repeated." divider>
              <Picker
                selectedValue={settings.repetitions}
                onValueChange={(value) => {
                  haptic.selection();
                  actions.updateSettings({ repetitions: Number(value) });
                }}>
                {[3, 4, 6].map((n) => (
                  <Picker.Item key={n} label={`${n}×`} value={n} />
                ))}
              </Picker>
            </Row>
            <Row label="Pace" detail="Time to rest in each phrase." divider>
              <Picker
                selectedValue={settings.pace}
                onValueChange={(value) => {
                  haptic.selection();
                  actions.updateSettings({ pace: value as Pace });
                }}>
                <Picker.Item label="Steady" value="steady" />
                <Picker.Item label="Slow" value="slow" />
              </Picker>
            </Row>
          </Group>

          <Group title="Data">
            <Pressable
              accessibilityRole="button"
              disabled={sessionCount === 0 && stage === 1}
              onPress={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                haptic.success();
                actions.resetProgress();
                setConfirmReset(false);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: Spacing.five,
                paddingVertical: Spacing.four,
                minHeight: 52,
                justifyContent: 'center',
                backgroundColor: pressed ? theme.surfaceMuted : 'transparent',
                opacity: sessionCount === 0 && stage === 1 ? 0.4 : 1,
              })}>
              <AppText variant="body" style={{ color: confirmReset ? theme.danger : theme.text }}>
                {confirmReset ? 'Tap again to erase all progress' : 'Reset progress'}
              </AppText>
              <AppText variant="footnote" tone="secondary">
                {confirmReset
                  ? 'This removes your session history and returns you to stage 1.'
                  : `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} saved on this device.`}
              </AppText>
            </Pressable>
          </Group>

          <View style={{ gap: Spacing.two, paddingHorizontal: Spacing.one }}>
            <AppText variant="footnote" tone="tertiary">
              Autogenic training is a relaxation method developed by Johannes Schultz in the 1930s.
              It is not a substitute for medical care. Stop if an exercise feels uncomfortable, and
              never practice while driving or operating machinery.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <AppText variant="caption" tone="tertiary" style={{ paddingHorizontal: Spacing.one }}>
        {title}
      </AppText>
      <Card padded={false}>{children}</Card>
    </View>
  );
}

function Row({
  label,
  detail,
  divider,
  children,
}: {
  label: string;
  detail?: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
        paddingHorizontal: Spacing.five,
        paddingVertical: Spacing.three,
        minHeight: 56,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: theme.separator,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body">{label}</AppText>
        {detail ? (
          <AppText variant="footnote" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      <Host matchContents seedColor={theme.accent} colorScheme={scheme ?? undefined}>
        {children}
      </Host>
    </View>
  );
}
