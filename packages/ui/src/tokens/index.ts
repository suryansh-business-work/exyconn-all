/**
 * The design tokens — the vocabulary every other file is built from.
 *
 * Nothing outside this folder writes a raw colour, a px font size, a shadow or a duration.
 * A screen that needs one imports the token; a token that needs to change is changed here
 * once. `modes/` holds the light and dark answers to the same set of semantic roles, and
 * `createAppTheme` is the only consumer that reads them directly — components get them
 * through the MUI theme (`theme.palette.*`) as they always have.
 */
export * from './colors.tokens';
export * from './font-size.token';
export * from './typography.token';
export * from './spacing.token';
export * from './border.token';
export * from './box-shadow.token';
export * from './backgrounds.token';
export * from './motion.token';
export * from './z-index.token';
export * from './modes';
export { ThemeProvider, type ThemeProviderProps } from './ThemeProvider';
