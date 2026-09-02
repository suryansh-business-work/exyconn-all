/**
 * Styling utilities, re-exported so the rest of the app never imports from
 * `@mui/material/styles` directly (enforced by the ESLint `no-restricted-imports`
 * guard). Theme construction lives in `src/config/theme.ts`.
 */
export { styled, alpha, useTheme, ThemeProvider, createTheme } from '@mui/material/styles';
export type { Theme } from '@mui/material/styles';
