import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { plainPaletteFor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hydrate, useAppState } from '@/store/app-store';

SplashScreen.preventAutoHideAsync();
hydrate();

export default function RootLayout() {
  const scheme = useColorScheme();
  const hydrated = useAppState((s) => s.hydrated);
  const palette = plainPaletteFor(scheme === 'dark' ? 'dark' : 'light');
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  // Hold the splash until saved progress is loaded, so nothing flashes.
  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: palette.accent,
          background: palette.background,
          card: palette.background,
          text: palette.text,
          border: palette.separator,
        },
      }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="session"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.75, 1],
            headerShown: true,
            title: 'Settings',
            contentStyle: { backgroundColor: palette.background },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
