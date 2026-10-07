import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';

export interface ProviderOptions {
  /** Apollo responses the screen may ask for; anything unmatched answers with an error. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter starts, e.g. `/sign/abc` or `/unsubscribe?token=x`. */
  route?: string;
  /** Route pattern to mount the element under, so `useParams` sees e.g. `:token`. */
  path?: string;
}

/**
 * The providers App puts above every status page: Apollo, a router, the color-mode provider
 * (which also supplies the MUI theme and `useColorMode` for StatusHeader) and the snackbar
 * provider. `@exyconn/i18n` needs no provider: its default context is English pass-through.
 */
export function createWrapper({ mocks = [], route = '/', path }: Readonly<ProviderOptions> = {}) {
  return function Providers({ children }: Readonly<{ children: ReactNode }>) {
    const routed = path ? (
      <Routes>
        <Route path={path} element={children} />
        {/* Where a page navigated to once it left its own route (read with currentUrl()). */}
        <Route path="*" element={<LeftTo />} />
      </Routes>
    ) : (
      children
    );
    return (
      <MockedProvider mocks={mocks} showWarnings={false}>
        <MemoryRouter initialEntries={[route]}>
          <ColorModeProvider>
            <NotificationProvider>{routed}</NotificationProvider>
          </ColorModeProvider>
        </MemoryRouter>
      </MockedProvider>
    );
  };
}

/** `render` with the status app providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions & Omit<RenderOptions, 'wrapper'>> = {},
) {
  const { mocks, route, path, ...rest } = options;
  return render(ui, { wrapper: createWrapper({ mocks, route, path }), ...rest });
}

/** `renderHook` with the status app providers around the hook. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options: Readonly<ProviderOptions> = {},
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}

/** Reads the router's current location, for asserting redirects and query-driven state. */
function LeftTo() {
  return <span data-testid="current-url">{useCurrentUrl()}</span>;
}

export function useCurrentUrl(): string {
  const { pathname, search } = useLocation();
  return `${pathname}${search}`;
}
