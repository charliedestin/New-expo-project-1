import { SymbolView } from 'expo-symbols';

import type { IconName } from '@/data/exercises';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  weight?: 'regular' | 'medium' | 'semibold';
};

/** SF Symbols on iOS, Material Symbols on Android and web. */
export function Icon({ name, size = 22, color, weight = 'regular' }: Props) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
