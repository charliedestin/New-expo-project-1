import { FieldGroup, Host, Picker, Row, Spacer, Switch, Text } from '@expo/ui';
import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText } from '@/components/app-text';
import { plainPaletteFor, Spacing } from '@/constants/theme';
import { EXERCISES } from '@/data/exercises';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { actions, useAppState, type Pace, type VoiceMode } from '@/store/app-store';

const supportsHaptics = process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android';

/**
 * A native form: SwiftUI `Form` on iOS, Compose on Android, a matching grouped list on web.
 * Native controls carry the platform's own design language, so nothing here is restyled.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const plain = plainPaletteFor(scheme);
  const settings = useAppState((s) => s.settings);
  const stage = useAppState((s) => s.stage);
  const sessionCount = useAppState((s) => s.sessions.length);

  const resetProgress = async () => {
    const ok = await confirm({
      title: 'Reset all progress?',
      message: `This deletes ${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} from this device and returns you to stage 1. It can’t be undone.`,
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (ok) {
      haptic.success();
      actions.resetProgress();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              style={{ paddingHorizontal: Spacing.sm }}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
              <AppText variant="headline" tone="accent">
                Done
              </AppText>
            </Pressable>
          ),
        }}
      />
      <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={theme.accent}>
        <FieldGroup
          style={process.env.EXPO_OS === 'web' ? { backgroundColor: plain.background } : undefined}>
          <FieldGroup.Section title="Guidance">
            <Row alignment="center">
              <Text>Voice</Text>
              <Spacer flexible />
              <Picker<VoiceMode>
                selectedValue={settings.voice}
                accessibilityLabel="Voice"
                onValueChange={(voice) => actions.updateSettings({ voice })}>
                <Picker.Item label="Off" value="off" />
                <Picker.Item label="Once per phrase" value="once" />
                <Picker.Item label="Every repetition" value="every" />
              </Picker>
            </Row>
            <Switch
              label="Bell"
              value={settings.bell}
              onValueChange={(bell) => actions.updateSettings({ bell })}
            />
            {supportsHaptics ? (
              <Switch
                label="Gentle taps"
                value={settings.haptics}
                onValueChange={(on) => actions.updateSettings({ haptics: on })}
              />
            ) : null}
            <FieldGroup.SectionFooter>
              <Text textStyle={{ fontSize: 13, color: plain.textSecondary }}>
                With your eyes closed, the bell marks each new phrase and the end of the session.
              </Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Session">
            <Row alignment="center">
              <Text>Stage</Text>
              <Spacer flexible />
              <Picker<number>
                selectedValue={stage}
                accessibilityLabel="Stage"
                onValueChange={(value) => actions.setStage(value)}>
                {EXERCISES.map((e) => (
                  <Picker.Item key={e.id} label={`${e.stage}. ${e.title}`} value={e.stage} />
                ))}
              </Picker>
            </Row>
            <Row alignment="center">
              <Text>Repetitions</Text>
              <Spacer flexible />
              <Picker<number>
                selectedValue={settings.repetitions}
                accessibilityLabel="Repetitions"
                onValueChange={(repetitions) => actions.updateSettings({ repetitions })}>
                {[3, 4, 6].map((n) => (
                  <Picker.Item key={n} label={`${n} times`} value={n} />
                ))}
              </Picker>
            </Row>
            <Row alignment="center">
              <Text>Pace</Text>
              <Spacer flexible />
              <Picker<Pace>
                selectedValue={settings.pace}
                accessibilityLabel="Pace"
                onValueChange={(pace) => actions.updateSettings({ pace })}>
                <Picker.Item label="Steady" value="steady" />
                <Picker.Item label="Slow" value="slow" />
              </Picker>
            </Row>
            <FieldGroup.SectionFooter>
              <Text textStyle={{ fontSize: 13, color: plain.textSecondary }}>
                Slow gives each phrase 16 seconds instead of 12.
              </Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section>
            <Text
              textStyle={{
                color: sessionCount === 0 && stage === 1 ? plain.textTertiary : plain.danger,
              }}
              disabled={sessionCount === 0 && stage === 1}
              onPress={resetProgress}>
              Reset progress
            </Text>
            <FieldGroup.SectionFooter>
              <Text textStyle={{ fontSize: 13, color: plain.textSecondary }}>
                Autogenic training was developed by Johannes Schultz in the 1930s. It isn’t a
                substitute for medical care. Stop if an exercise feels uncomfortable, and never
                practice while driving.
              </Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </>
  );
}
