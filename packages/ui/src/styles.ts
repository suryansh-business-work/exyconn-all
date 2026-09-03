/**
 * Styling utilities, re-exported so nothing outside this package imports from
 * `@mui/material/styles` or `@mui/system` directly (enforced by the ESLint
 * `no-restricted-imports` guard). Theme construction lives in `./theme`.
 *
 * The pickers' theme augmentation is pulled in here so `createTheme` accepts
 * `MuiPickersDay` & co. wherever a theme is built.
 */
import type {} from '@mui/x-date-pickers/themeAugmentation';

export { styled, alpha, useTheme, ThemeProvider, createTheme } from '@mui/material/styles';
export { default as CssBaseline } from '@mui/material/CssBaseline';
export type { Theme, SxProps, CSSObject } from '@mui/material/styles';
export type { SystemStyleObject } from '@mui/system';
