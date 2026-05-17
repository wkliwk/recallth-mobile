import { useColorScheme } from 'react-native';
import { useAppearanceStore } from '../stores/appearance';
import { ColorPalette, darkColors, lightColors } from './theme';

/** Returns the active colour palette respecting user override + system setting. */
export function useThemeColors(): ColorPalette {
  const systemScheme = useColorScheme();
  const mode = useAppearanceStore((s) => s.mode);

  if (mode === 'dark') return darkColors;
  if (mode === 'light') return lightColors;
  return systemScheme === 'dark' ? darkColors : lightColors;
}

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const mode = useAppearanceStore((s) => s.mode);
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return systemScheme === 'dark';
}
