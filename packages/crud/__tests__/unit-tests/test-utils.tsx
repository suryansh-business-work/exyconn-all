import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '@exyconn/ui';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';

const testTheme = createAppTheme('light');

export interface ProviderOptions {
  /** Apollo responses the screen may ask for; anything unmatched answers with an error. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter starts, e.g. `/leads?form=new`. */
  route?: string;
}

/**
 * Everything a crud component or hook expects above it: the portal MUI theme, a router
 * (useCrudDialog keeps its mode in the URL), Apollo, and the confirm and snackbar providers.
 * `@exyconn/i18n` needs no provider — its context defaults to English pass-through.
 */
export function createWrapper({ mocks = [], route = '/' }: Readonly<ProviderOptions> = {}) {
  return function Providers({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <MockedProvider mocks={mocks} showWarnings={false}>
        <MemoryRouter initialEntries={[route]}>
          <ThemeProvider theme={testTheme}>
            <NotificationProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </NotificationProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>
    );
  };
}

/** `render` with the crud providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
) {
  const { mocks, route, ...rest } = options;
  return render(ui, { wrapper: createWrapper({ mocks, route }), ...rest });
}

/** `renderHook` with the crud providers around the hook. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options: Readonly<ProviderOptions> = {},
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}

/** Reads the router's current search string, for asserting URL-driven state. */
export function useSearch(): string {
  return useLocation().search;
}
