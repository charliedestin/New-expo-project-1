import { View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = ViewProps & { padded?: boolean; tone?: 'surface' | 'muted' | 'accent' };

export function Card({ padded = true, tone = 'surface', style, ...rest }: Props) {
  const theme = useTheme();
  const backgroundColor = {
    surface: theme.surface,
    muted: theme.surfaceMuted,
    accent: theme.accentSoft,
  }[tone];

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor,
          borderRadius: Radius.card,
          borderCurve: 'continuous',
          boxShadow: tone === 'surface' ? theme.shadow : undefined,
          padding: padded ? Spacing.five : 0,
          overflow: 'hidden',
        },
        style,
      ]}
    />
  );
}
