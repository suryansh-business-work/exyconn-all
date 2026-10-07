import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';

/** Provider options. They mirror what the shell's `PortalApp` puts above every Legal page. */
export interface ProviderOptions {
  /** Apollo mocks for MockedProvider. An unmatched operation resolves to an error result. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter opens. Defaults to `/`. */
  route?: string;
  /** Route pattern the UI is mounted under (e.g. `/legal/:tab?`), so `useParams` works. */
  path?: string;
  /** Translations (source string -> text). Empty means `t()` renders the English source. */
  messages?: Messages;
  /** Locale for the I18nProvider. Defaults to `en`. */
  locale?: string;
}

/**
 * Wraps children the way the Legal portal mounts a page: Apollo (mocked), i18n, the colour-mode
 * MUI theme, MUI X pickers, notifications, confirm dialogs and a memory router. `useAuth` has
 * no default context, so a test for a screen that calls it mocks
 * `@exyconn/shell/auth/AuthContext` with `vi.mock`.
 */
export function createWrapper({
  mocks = [],
  route = '/',
  path,
  messages = {},
  locale = 'en',
}: Readonly<ProviderOptions> = {}) {
  return function Providers({ children }: Readonly<{ children: ReactNode }>) {
    const content = path ? (
      <Routes>
        <Route path={path} element={children} />
      </Routes>
    ) : (
      children
    );
    return (
      <MockedProvider mocks={mocks} showWarnings={false}>
        <I18nProvider locale={locale} messages={messages}>
          <ColorModeProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <NotificationProvider>
                <ConfirmProvider>
                  <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
                </ConfirmProvider>
              </NotificationProvider>
            </LocalizationProvider>
          </ColorModeProvider>
        </I18nProvider>
      </MockedProvider>
    );
  };
}

/** `render` with the Legal portal providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
): RenderResult {
  const { mocks, route, path, messages, locale, ...rest } = options;
  return render(ui, {
    wrapper: createWrapper({ mocks, route, path, messages, locale }),
    ...rest,
  });
}

/** `renderHook` with the Legal portal providers around the hook. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options: Readonly<ProviderOptions> = {},
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}

/** Reads the router's current location, for asserting URL-driven state (tabs, ?form=). */
export function useCurrentUrl(): string {
  const { pathname, search } = useLocation();
  return `${pathname}${search}`;
}
