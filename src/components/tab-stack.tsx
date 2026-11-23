import { Stack } from 'expo-router';

import { plainPaletteFor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/** The stack inside each tab: native large titles on iOS, flat header everywhere. */
export function TabStack({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  // Navigation options want plain strings; on iOS the large-title header uses the system material.
  const plain = plainPaletteFor(useColorScheme() === 'dark' ? 'dark' : 'light');
  const ios = process.env.EXPO_OS === 'ios';

  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerTransparent: ios,
        headerBlurEffect: ios ? 'systemMaterial' : undefined,
        headerStyle: ios ? undefined : { backgroundColor: plain.background },
        headerLargeStyle: ios ? { backgroundColor: 'transparent' } : undefined,
        headerTitleStyle: { color: plain.text },
        headerTintColor: theme.accent,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.background },
      }}>
      {children}
    </Stack>
  );
}
