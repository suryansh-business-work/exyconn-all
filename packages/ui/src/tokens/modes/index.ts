import { darkTokens } from './dark.token';
import { lightTokens } from './light.token';
import type { ColorMode } from './color-mode';
import type { SemanticTokens } from './semantic-tokens';

export { COLOR_MODES, type ColorMode } from './color-mode';
export type { SemanticTokens } from './semantic-tokens';
export { lightTokens } from './light.token';
export { darkTokens } from './dark.token';

/** Both palettes, keyed by mode. */
export const modeTokens: Record<ColorMode, SemanticTokens> = {
  light: lightTokens,
  dark: darkTokens,
};

/** The semantic tokens for one mode — the single entry point `createAppTheme` calls. */
export function tokensFor(mode: ColorMode): SemanticTokens {
  return modeTokens[mode];
}
