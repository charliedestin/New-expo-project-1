import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Radius, Spacing } from '@/constants/theme';
import type { IconName } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale on press-in. Rows should pass 1 and rely on a highlight instead. */
  pressedScale?: number;
};

/** Press feedback that lands on press-in, 120 ms, strong ease-out. */
export function PressableScale({
  style,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    const p = pressed.get();
    return reduceMotion
      ? { opacity: 1 - p * 0.25 }
      : { transform: [{ scale: 1 - p * (1 - pressedScale) }] };
  });

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        pressed.set(withTiming(1, { duration: 100, easing: EASE_OUT }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(0, { duration: 160, easing: EASE_OUT }));
        onPressOut?.(e);
      }}>
      <Animated.View style={[style, animatedStyle]}>{children as React.ReactNode}</Animated.View>
    </Pressable>
  );
}

type ButtonProps = Omit<PressableScaleProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  size?: 'large' | 'medium';
};

export function Button({
  label,
  variant = 'primary',
  icon,
  size = 'large',
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const fg = primary ? theme.onAccent : theme.accent;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      {...rest}
      style={[
        {
          minHeight: size === 'large' ? 54 : 44,
          paddingHorizontal: size === 'large' ? Spacing.six : Spacing.five,
          borderRadius: Radius.pill,
          backgroundColor: primary ? theme.accent : theme.accentSoft,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.two,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      {icon && <Icon name={icon} size={size === 'large' ? 20 : 18} color={fg} weight="semibold" />}
      <AppText variant="headline" style={{ color: fg }}>
        {label}
      </AppText>
    </PressableScale>
  );
}
