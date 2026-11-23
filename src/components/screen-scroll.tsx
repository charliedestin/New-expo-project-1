import { ScrollView, View, type ScrollViewProps } from 'react-native';

import { MaxContentWidth, ScreenInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Root scroll container for a stack screen: native insets, capped reading width, section rhythm. */
export function ScreenScroll({ children, contentContainerStyle, ...rest }: ScrollViewProps) {
  const theme = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        { paddingHorizontal: ScreenInset, paddingTop: Spacing.sm, paddingBottom: Spacing.section },
        contentContainerStyle,
      ]}
      {...rest}>
      <View
        style={{
          width: '100%',
          maxWidth: MaxContentWidth,
          alignSelf: 'center',
          gap: Spacing.section - Spacing.xs,
        }}>
        {children}
      </View>
    </ScrollView>
  );
}
