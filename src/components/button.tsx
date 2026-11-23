import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Motion, Radius, Spacing } from '@/constants/theme';
import type { IconName } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Button-like press feedback: scale 0.97 on press-in, as a Reanimated CSS transition (a state
 * change, not a gesture, so no shared values). Reduce Motion swaps the scale for a dim.
 */
export function PressableScale({
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <Pressable
      {...rest}
      pressRetentionOffset={16}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: pressed && !reduceMotion ? 0.97 : 1 }],
            opacity: pressed && reduceMotion ? 0.7 : 1,
            transitionProperty: ['transform', 'opacity'],
            transitionDuration: pressed ? Motion.press - 20 : Motion.press + 40,
            transitionTimingFunction: EASE_OUT,
          },
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

type ButtonProps = Omit<PressableScaleProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'plain';
  icon?: IconName;
  size?: 'large' | 'medium';
  /** For surfaces with their own palette (the session screen). */
  colors?: { background: string; foreground: string };
};

export function Button({
  label,
  variant = 'primary',
  icon,
  size = 'large',
  style,
  disabled,
  colors,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const fg = colors?.foreground ?? (variant === 'primary' ? theme.onAccent : theme.accent);
  const bg =
    colors?.background ??
    { primary: theme.accent, secondary: theme.accentSoft, plain: 'transparent' }[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={[
        {
          minHeight: size === 'large' ? 52 : 40,
          paddingHorizontal: size === 'large' ? Spacing.xl : Spacing.lg,
          borderRadius: Radius.capsule,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.sm,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}>
      {icon && <Icon name={icon} size={size === 'large' ? 17 : 15} color={fg} weight="semibold" />}
      <AppText variant={size === 'large' ? 'headline' : 'subhead'} weight="600" color={fg}>
        {label}
      </AppText>
    </PressableScale>
  );
}
