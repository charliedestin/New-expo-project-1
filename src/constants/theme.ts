/**
 * Design tokens for Autogenic. One source of truth; components read these, screens read components.
 *
 * Rules (keep them):
 * - Neutrals are the platform's. On iOS they are UIKit semantic colors (grouped backgrounds,
 *   label colors), so the app sits next to Settings and Health without looking foreign.
 *   Web and Android use the matching light/dark values below.
 * - One accent: sage. Primary action, selection, progress. `danger` only confirms a destructive act.
 * - No shadows. Grouping comes from background contrast and hairline separators.
 * - Shape: actions are capsules, grouped sections are 16, icon tiles are 10. Continuous corners.
 * - Spacing: 4-point grid, and row gap < group gap < section gap.
 * - The session screen has its own fixed dim palette: people practice with their eyes closed,
 *   often in a dark room, so it never flashes a light surface.
 */

import '@/global.css';

import { Platform, type ColorValue } from 'react-native';

type Neutrals = {
  background: ColorValue;
  surface: ColorValue;
  fill: ColorValue;
  text: ColorValue;
  textSecondary: ColorValue;
  textTertiary: ColorValue;
  separator: ColorValue;
};

type Brand = {
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
};

export type Palette = Neutrals & Brand;

const hexNeutrals: Record<'light' | 'dark', Neutrals> = {
  light: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    fill: 'rgba(118, 118, 128, 0.12)',
    text: '#000000',
    textSecondary: 'rgba(60, 60, 67, 0.6)',
    textTertiary: 'rgba(60, 60, 67, 0.3)',
    separator: 'rgba(60, 60, 67, 0.18)',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    fill: 'rgba(118, 118, 128, 0.24)',
    text: '#FFFFFF',
    textSecondary: 'rgba(235, 235, 245, 0.6)',
    textTertiary: 'rgba(235, 235, 245, 0.3)',
    separator: 'rgba(84, 84, 88, 0.6)',
  },
};

const brand: Record<'light' | 'dark', Brand> = {
  light: {
    accent: '#3A7560',
    accentSoft: 'rgba(58, 117, 96, 0.12)',
    onAccent: '#FFFFFF',
    danger: '#D63B2F',
  },
  dark: {
    accent: '#7FC2A5',
    accentSoft: 'rgba(127, 194, 165, 0.16)',
    onAccent: '#0B1A13',
    danger: '#FF6B5E',
  },
};

/** UIKit semantic colors. Built lazily: `Color.ios` only exists on iOS. */
let iosNeutrals: Neutrals | null = null;
function getIosNeutrals(): Neutrals {
  if (!iosNeutrals) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Color } = require('expo-router') as typeof import('expo-router');
    iosNeutrals = {
      background: Color.ios.systemGroupedBackground,
      surface: Color.ios.secondarySystemGroupedBackground,
      fill: Color.ios.tertiarySystemFill,
      text: Color.ios.label,
      textSecondary: Color.ios.secondaryLabel,
      textTertiary: Color.ios.tertiaryLabel,
      separator: Color.ios.separator,
    };
  }
  return iosNeutrals;
}

export function paletteFor(scheme: 'light' | 'dark'): Palette {
  const neutrals = process.env.EXPO_OS === 'ios' ? getIosNeutrals() : hexNeutrals[scheme];
  return { ...neutrals, ...brand[scheme] };
}

/** Plain strings for places that can't take native color objects (navigation theme, Reanimated). */
export function plainPaletteFor(scheme: 'light' | 'dark') {
  return { ...hexNeutrals[scheme], ...brand[scheme] } as Record<keyof Palette, string>;
}

/** The session screen, in both system themes. */
export const SessionPalette = {
  background: '#0B0C0B',
  text: '#ECEDEA',
  textSecondary: 'rgba(236, 237, 234, 0.6)',
  textTertiary: 'rgba(236, 237, 234, 0.32)',
  fill: 'rgba(255, 255, 255, 0.08)',
  track: 'rgba(255, 255, 255, 0.14)',
  accent: brand.dark.accent,
  accentSoft: brand.dark.accentSoft,
  onAccent: brand.dark.onAccent,
} as const;

export const Radius = {
  group: 16,
  tile: 10,
  capsule: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
  section: 36,
} as const;

/** Edge inset for screen content, and the leading inset of rows inside a group. */
export const ScreenInset = Spacing.lg;

export const Motion = {
  press: 120,
  state: 200,
  enter: 260,
  /** The phrase cross-fade. Slower on purpose: it changes while someone is deeply relaxed. */
  phrase: 600,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui' },
  web: { sans: 'var(--font-display)' },
  default: { sans: 'normal' },
});

/** Reading width cap so web and tablet layouts don't stretch lines across the screen. */
export const MaxContentWidth = 620;
