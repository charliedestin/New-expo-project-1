import { Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The app's type ramp. One display size per screen. */
const variants = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '500', letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.6 },
  stat: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: -0.4 },
} satisfies Record<string, TextStyle>;

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent';

type Props = TextProps & {
  variant?: keyof typeof variants;
  tone?: Tone;
  numeric?: boolean;
  center?: boolean;
};

export function AppText({
  variant = 'body',
  tone = 'primary',
  numeric,
  center,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const color = {
    primary: theme.text,
    secondary: theme.textSecondary,
    tertiary: theme.textTertiary,
    accent: theme.accent,
    onAccent: theme.onAccent,
  }[tone];

  return (
    <Text
      {...rest}
      style={[
        { fontFamily: Fonts.sans, color },
        variants[variant],
        variant === 'caption' && { textTransform: 'uppercase' },
        numeric && { fontVariant: ['tabular-nums'] },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
