// One subpath per weight: the package index requires all eighteen files, and Metro would ship
// every one of them in the app.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { createSystemFont } from '@tamagui/config/v5';

/**
 * Inter, loaded at launch by the root layout (`useFonts(INTER_FILES)`). Each key becomes a font
 * family on both platforms, and Tamagui's face map picks the file for a weight — Android draws
 * a custom font's weights only from separate files, never by synthesising them.
 */
export const INTER_FILES = { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold };

const REGULAR = { normal: 'Inter_400Regular' };
const BOLD = { normal: 'Inter_700Bold' };

const FACE = {
  300: REGULAR,
  400: REGULAR,
  500: { normal: 'Inter_500Medium' },
  600: { normal: 'Inter_600SemiBold' },
  700: BOLD,
  800: BOLD,
  900: BOLD,
};

export const fonts = {
  body: createSystemFont({ font: { family: 'Inter_400Regular', face: FACE } }),
  heading: createSystemFont({
    font: { family: 'Inter_400Regular', face: FACE, weight: { 0: '600', 6: '700', 9: '700' } },
    sizeLineHeight: (size) => Math.round(size * 1.2),
  }),
};
