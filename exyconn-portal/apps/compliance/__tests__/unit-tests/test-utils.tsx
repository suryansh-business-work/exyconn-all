import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { theme } from '@exyconn/shell/config/theme';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';

export interface ProviderOptions {
  /** Apollo responses the screen may ask for; anything unmatched answers with an error. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter starts, e.g. `/compliance/risks?form=new`. */
  route?: string;
  /** Route pattern to mount the element under, so `useParams` works. */
  path?: string;
  /** Translations. Empty means `t()` renders the English source. */
  messages?: Messages;
  /** Locale for the I18nProvider. Defaults to `en`. */
  locale?: string;
}

/**
 * The providers PortalApp puts above every compliance page: Apollo (mocked), i18n, a memory
 * router, the portal MUI theme, the MUI X date adapter, and the snackbar and confirm
 * providers (`useCrudResource` needs ConfirmProvider, `useEntitySave` NotificationProvider).
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
          <MemoryRouter initialEntries={[route]}>
            <ThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <NotificationProvider>
                  <ConfirmProvider>{routed}</ConfirmProvider>
                </NotificationProvider>
              </LocalizationProvider>
            </ThemeProvider>
          </MemoryRouter>
        </I18nProvider>
      </MockedProvider>
    );
  };
}

/** `render` with the compliance portal providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
) {
  const { mocks, route, path, messages, locale, ...rest } = options;
  return render(ui, { wrapper: createWrapper({ mocks, route, path, messages, locale }), ...rest });
}

/** `renderHook` with the compliance portal providers around the hook. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options: Readonly<ProviderOptions> = {},
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}

/** Reads the router's current location, for asserting URL-driven state (e.g. `?form=`). */
export function useCurrentUrl(): string {
  const { pathname, search } = useLocation();
  return `${pathname}${search}`;
}
