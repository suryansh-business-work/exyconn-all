import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import { ThemeProvider } from '../../src/tokens/ThemeProvider';
import { createAppTheme } from '../../src/theme';
import type { ColorMode } from '../../src/tokens/modes';

/** Options for {@link renderWithProviders}: the colour mode and, optionally, a locale catalogue. */
export interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Theme mode the tree renders under. Defaults to light. */
  mode?: ColorMode;
  /** When set, the tree sits under an I18nProvider with these messages (source string -> text). */
  messages?: Record<string, string>;
  /** Locale for the I18nProvider. Only used together with `messages`. Defaults to `en`. */
  locale?: string;
}

interface WrapperProps {
  children: ReactNode;
}

/**
 * Renders a component the way an app mounts it: the Exyconn MUI theme (with CssBaseline) for the
 * requested mode and, when `messages` are given, an I18nProvider. Without `messages`, `useT()`
 * falls back to the source string, which is what the shipped English renders.
 */
export function renderWithProviders(
  ui: ReactElement,
  { mode = 'light', messages, locale = 'en', ...options }: ProviderOptions = {},
): RenderResult {
  const theme = createAppTheme(mode);
  function Wrapper({ children }: Readonly<WrapperProps>) {
    const themed = <ThemeProvider theme={theme}>{children}</ThemeProvider>;
    if (messages) {
      return (
        <I18nProvider locale={locale} messages={messages}>
          {themed}
        </I18nProvider>
      );
    }
    return themed;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
