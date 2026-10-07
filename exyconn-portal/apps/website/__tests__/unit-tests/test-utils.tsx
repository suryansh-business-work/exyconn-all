import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';

/** Options for the render helpers. The providers mirror the shell's `PortalApp`. */
export interface ProviderOptions {
  /** Apollo responses the screen may ask for; an unmatched operation resolves to an error. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter opens, e.g. `/website/s/main/pages`. Defaults to `/`. */
  route?: string;
  /** Route pattern to mount the element under (e.g. `/website/s/:siteSlug/pages`), so `useParams` works. */
  path?: string;
  /** Translations (source string -> text). Empty means `t()` renders the English source. */
  messages?: Messages;
  /** Locale for the I18nProvider. Defaults to `en`. */
  locale?: string;
}

/**
 * The providers PortalApp puts above every website page: Apollo (mocked), i18n, the
 * colour-mode MUI theme, MUI X pickers, notifications, confirm dialogs and a memory router.
 * `useAuth` has no default context, so a test that renders a screen using it mocks
 * `@exyconn/shell/auth/AuthContext`.
 */
export function createWrapper({
  mocks = [],
  route = '/',
  path,
  messages = {},
  locale = 'en',
}: Readonly<ProviderOptions> = {}) {
  return function Providers({ children }: Readonly<{ children: ReactNode }>) {
    const routed = path ? (
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
                  <MemoryRouter initialEntries={[route]}>{routed}</MemoryRouter>
                </ConfirmProvider>
              </NotificationProvider>
            </LocalizationProvider>
          </ColorModeProvider>
        </I18nProvider>
      </MockedProvider>
    );
  };
}

/** `render` with the website portal providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
) {
  const { mocks, route, path, messages, locale, ...rest } = options;
  return render(ui, { wrapper: createWrapper({ mocks, route, path, messages, locale }), ...rest });
}

/** `renderHook` with the website portal providers around the hook. */
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
