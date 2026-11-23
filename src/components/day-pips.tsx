import { View, type ColorValue } from 'react-native';

import { DAILY_TARGET } from '@/lib/stats';

type Props = {
  count: number;
  filled: ColorValue;
  empty: ColorValue;
  size?: number;
  /** Vertical stack (week view) or a row (today). */
  direction?: 'row' | 'column';
};

/** Sessions against the daily target of three: filled for done, an outline for still to go. */
export function DayPips({ count, filled, empty, size = 8, direction = 'row' }: Props) {
  const slots = Math.max(DAILY_TARGET, count);
  return (
    <View
      style={{ flexDirection: direction === 'row' ? 'row' : 'column-reverse', gap: size * 0.6 }}
      importantForAccessibility="no-hide-descendants">
      {Array.from({ length: slots }, (_, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: i < count ? filled : 'transparent',
            borderWidth: i < count ? 0 : 1.5,
            borderColor: empty,
          }}
        />
      ))}
    </View>
  );
}
