/** The two palettes the whole system ships. Everything mode-aware is keyed by this. */
export type ColorMode = 'light' | 'dark';

/** Both modes, in the order a toggle cycles them. */
export const COLOR_MODES: readonly ColorMode[] = ['light', 'dark'];
