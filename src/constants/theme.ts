/**
 * Design tokens for Autogenic.
 *
 * Rules (keep them):
 * - One accent: sage. It marks the primary action, the active state and progress. Nothing else.
 *   `danger` is reserved for confirming something destructive.
 * - One grey family: warm greys only.
 * - Shape: actions and chips are pills, cards are 20, small tiles are 14. Always continuous corners.
 * - Spacing: multiples of 4.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F6F4EF',
    surface: '#FFFFFF',
    surfaceMuted: '#EFECE5',
    text: '#1F1D1A',
    textSecondary: '#6B665E',
    textTertiary: '#98928A',
    separator: '#E4E0D8',
    accent: '#3F7D66',
    accentSoft: 'rgba(63, 125, 102, 0.12)',
    onAccent: '#FFFFFF',
    danger: '#B8442F',
    shadow: '0 1px 2px rgba(31, 29, 26, 0.06), 0 4px 16px rgba(31, 29, 26, 0.05)',
  },
  dark: {
    background: '#12110F',
    surface: '#1D1B18',
    surfaceMuted: '#282522',
    text: '#F2EFE9',
    textSecondary: '#A8A197',
    textTertiary: '#7A746B',
    separator: '#2E2B27',
    accent: '#7FC2A5',
    accentSoft: 'rgba(127, 194, 165, 0.16)',
    onAccent: '#0E1A14',
    danger: '#E8826E',
    shadow: '0 0 0 1px rgba(255, 255, 255, 0.04)',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Radius = {
  card: 20,
  tile: 14,
  pill: 999,
} as const;

export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)' },
  default: { sans: 'normal', rounded: 'normal' },
});

/** Reading width cap so web/tablet layouts don't stretch lines across the screen. */
export const MaxContentWidth = 640;
