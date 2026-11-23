import { ScrollView, View, type ScrollViewProps } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Root scroll container for a tab screen: native insets, capped reading width. */
export function ScreenScroll({ children, contentContainerStyle, ...rest }: ScrollViewProps) {
  const theme = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        { paddingHorizontal: Spacing.five, paddingTop: Spacing.two, paddingBottom: Spacing.ten },
        contentContainerStyle,
      ]}
      {...rest}>
      <View
        style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.six }}>
        {children}
      </View>
    </ScrollView>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: Spacing.one, marginBottom: -Spacing.three }}>{children}</View>
  );
}
