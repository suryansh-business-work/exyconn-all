import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';

export interface ProviderOptions {
  /** Apollo responses the screen may ask for; anything unmatched answers with an error. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter starts, e.g. `/invoices?status=OPEN`. */
  route?: string;
  /** Route pattern to mount the element under, so `useParams` sees e.g. `:id`. */
  path?: string;
}

/**
 * The providers PortalApp puts above every client hub page: Apollo, a router, the portal MUI
 * theme, the MUI X date adapter, and the snackbar and confirm providers. `@exyconn/i18n`
 * needs no provider (its default context is English pass-through). `useSettings` asks for
 * AppSettings; when no mock answers it, it formats with its built-in defaults.
 */
export function createWrapper({ mocks = [], route = '/', path }: Readonly<ProviderOptions> = {}) {
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
        <MemoryRouter initialEntries={[route]}>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <NotificationProvider>
                <ConfirmProvider>{routed}</ConfirmProvider>
              </NotificationProvider>
            </LocalizationProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>
    );
  };
}

/** `render` with the client hub providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
) {
  const { mocks, route, path, ...rest } = options;
  return render(ui, { wrapper: createWrapper({ mocks, route, path }), ...rest });
}

/** `renderHook` with the client hub providers around the hook. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options: Readonly<ProviderOptions> = {},
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}

/** Reads the router's current location, for asserting redirects and URL-driven state. */
export function useCurrentUrl(): string {
  const { pathname, search } = useLocation();
  return `${pathname}${search}`;
}
