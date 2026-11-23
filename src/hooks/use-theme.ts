import { paletteFor, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): Palette {
  // Read the scheme even on iOS (where colors are semantic) so components re-render when it flips.
  const scheme = useColorScheme();
  return paletteFor(scheme === 'dark' ? 'dark' : 'light');
}
