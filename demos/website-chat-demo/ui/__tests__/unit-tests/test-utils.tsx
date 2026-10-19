import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider } from '@exyconn/i18n';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';

/** Provider options: what the shell's `PortalApp` puts above the demo page. */
export interface ProviderOptions {
  /** Apollo mocks. An unmatched operation resolves to an error result. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** Where the MemoryRouter opens. Defaults to `/`. */
  route?: string;
  /** Route pattern the page is mounted under (e.g. `/:demoKey?`), so `useParams` works. */
  path?: string;
  /** Locale for the I18nProvider. Defaults to `en`. */
  locale?: string;
}

export function createWrapper({
  mocks = [],
  route = '/',
  path,
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
        <I18nProvider locale={locale} messages={{}}>
          <ColorModeProvider>
            <NotificationProvider>
              <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
            </NotificationProvider>
          </ColorModeProvider>
        </I18nProvider>
      </MockedProvider>
    );
  };
}

/** `render` with the demo page's providers around the element. */
export function renderWithProviders(
  ui: ReactElement,
  options: Readonly<ProviderOptions> = {},
): RenderResult {
  return render(ui, { wrapper: createWrapper(options) });
}

/** `renderHook` with the demo page's providers around the hook. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options: Readonly<ProviderOptions> = {},
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}

/** The router's current path, for asserting URL-driven state. */
export function useCurrentPath(): string {
  return useLocation().pathname;
}
