import { Text, type ColorValue, type TextProps, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The type ramp, mirroring Apple's text styles. One display size per screen.
 * `phrase` is reserved for the autogenic formulas themselves: lighter and larger, because they
 * are read slowly, not scanned.
 */
const variants = {
  phrase: { fontSize: 30, lineHeight: 38, fontWeight: '300', letterSpacing: -0.3 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  section: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.2 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.1 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof variants;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | 'danger';

type Props = TextProps & {
  variant?: TextVariant;
  tone?: Tone;
  /** Overrides tone, for surfaces with their own palette (the session screen). */
  color?: ColorValue;
  numeric?: boolean;
  center?: boolean;
  weight?: TextStyle['fontWeight'];
};

export function AppText({
  variant = 'body',
  tone = 'primary',
  color,
  numeric,
  center,
  weight,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const toneColor = {
    primary: theme.text,
    secondary: theme.textSecondary,
    tertiary: theme.textTertiary,
    accent: theme.accent,
    onAccent: theme.onAccent,
    danger: theme.danger,
  }[tone];

  return (
    <Text
      {...rest}
      style={[
        { fontFamily: Fonts.sans, color: color ?? toneColor },
        variants[variant],
        weight && { fontWeight: weight },
        numeric && { fontVariant: ['tabular-nums'] },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
