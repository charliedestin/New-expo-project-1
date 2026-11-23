import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** The stack inside each tab: native large titles on iOS, flat header everywhere. */
export function TabStack({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerLargeStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text },
        headerLargeTitleStyle: { color: theme.text },
        headerTintColor: theme.accent,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.background },
      }}>
      {children}
    </Stack>
  );
}
