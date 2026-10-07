import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';

/** Options for {@link renderWithProviders}. The providers mirror the shell's `PortalApp`. */
export interface ProviderOptions {
  /** Apollo responses the screen may ask for; anything unmatched answers with an error. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter starts, e.g. `/me/leave`. */
  route?: string;
  /** Route pattern to mount the element under, so `useParams` sees e.g. `:tab`. */
  path?: string;
}

/**
 * The providers PortalApp puts above every My Workspace page: Apollo (mocked), a router,
 * the portal MUI theme, the MUI X date adapter, and the snackbar and confirm providers.
 * `@exyconn/i18n` needs no provider (its default context is English pass-through), and
 * `useAuth` has no default, so a test that renders DashboardPage mocks
 * `@exyconn/shell/auth/AuthContext`.
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

/** `render` with the employee portal providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
) {
  const { mocks, route, path, ...rest } = options;
  return render(ui, { wrapper: createWrapper({ mocks, route, path }), ...rest });
}

/** `renderHook` with the employee portal providers around the hook. */
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
