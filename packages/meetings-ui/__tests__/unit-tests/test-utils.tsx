import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';

export interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Where the MemoryRouter opens. Defaults to `/`. */
  route?: string;
  /** Route pattern the UI is mounted under (e.g. `/m/meetings/:id/:tab?`), so `useParams` works. */
  path?: string;
}

/** Shows where the router is, so a test can assert a navigation or a URL param. */
export function LocationProbe() {
  const location = useLocation();
  return <output aria-label="location">{`${location.pathname}${location.search}`}</output>;
}

/**
 * Renders a screen the way a portal mounts it: Apollo (mocked — the generated hooks are
 * replaced per test), i18n, the theme, MUI X pickers, notifications, confirm dialogs and a
 * memory router with a location probe.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path, ...options }: ProviderOptions = {},
): RenderResult {
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    const content = path ? (
      <Routes>
        <Route path={path} element={children} />
        <Route path="*" element={null} />
      </Routes>
    ) : (
      children
    );
    return (
      <MockedProvider mocks={[]}>
        <I18nProvider locale="en" messages={{}}>
          <ColorModeProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <NotificationProvider>
                <ConfirmProvider>
                  <MemoryRouter initialEntries={[route]}>
                    {content}
                    <LocationProbe />
                  </MemoryRouter>
                </ConfirmProvider>
              </NotificationProvider>
            </LocalizationProvider>
          </ColorModeProvider>
        </I18nProvider>
      </MockedProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

interface QueryExtras {
  loading?: boolean;
  error?: Error;
  refetch?: ReturnType<typeof vi.fn>;
  fetchMore?: ReturnType<typeof vi.fn>;
}

/** What a generated `useXQuery` hook hands a component. */
export function queryResult<T>(data: T | undefined, extras: QueryExtras = {}) {
  return {
    data,
    loading: false,
    error: undefined,
    refetch: vi.fn().mockResolvedValue({ data }),
    ...extras,
  };
}

/** What a generated `useXMutation` hook hands a component: the run function and its state. */
export function mutationTuple(run: ReturnType<typeof vi.fn>, loading = false) {
  return [run, { loading }];
}

/** Stubs `location` (jsdom cannot navigate) and returns the `assign` spy. Undo with `vi.unstubAllGlobals()`. */
export function stubLocationAssign() {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...globalThis.location, assign, href: 'http://localhost/current' });
  return assign;
}
