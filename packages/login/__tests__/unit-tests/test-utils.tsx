import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { AuthProvider, type AuthUser } from '@exyconn/shell/auth/AuthContext';
import { tokenStore } from '@exyconn/shell/auth/tokenStore';
import { userStore } from '@exyconn/shell/auth/userStore';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';

/** Options for {@link renderWithProviders}; the providers mirror how `PortalApp` mounts the login. */
export interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Apollo mocks. An operation with no matching mock resolves to an error result. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** The URL (path + query) the MemoryRouter opens on. Defaults to `/`. */
  route?: string;
  /**
   * Extra `<Route>`s beside the component under test (which matches every other path), so a
   * test can assert where a `<Navigate>` or `navigate()` landed, e.g.
   * `<Route path="/dashboard" element={<p>dashboard</p>} />`.
   */
  routes?: ReactNode;
  /** Translations (source string -> text). Empty means `t()` renders the English source. */
  messages?: Messages;
  /** Locale for the I18nProvider. Defaults to `en`. */
  locale?: string;
  /** When set, the session is seeded (token + cached user) so AuthProvider starts signed in. */
  user?: AuthUser;
}

let sessionCounter = 0;

/** A fresh, non-secret session value per call, so no credential literal lives in the tests. */
export function makeSessionToken(): string {
  sessionCounter += 1;
  return ['test', 'session', sessionCounter].join('-');
}

/** A signed-in person with sensible defaults; override what a test cares about. */
export function makeUser(patch: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    name: 'Asha Rao',
    email: 'asha@example.com',
    roles: ['EMPLOYEE'],
    organizationId: 'org-1',
    ...patch,
  };
}

/** Signs a person in the way a page refresh finds them: token plus cached user. */
export function seedSession(user: AuthUser): string {
  const token = makeSessionToken();
  tokenStore.set(token);
  userStore.set(user);
  return token;
}

/** Clears any seeded session; call it in `afterEach` when a test signs someone in. */
export function clearSession(): void {
  tokenStore.clear();
  userStore.clear();
}

/**
 * Renders a login screen the way a portal mounts it: Apollo (MockedProvider), i18n, the
 * colour-mode theme (MUI ThemeProvider + `useColorMode`), the memory router, the auth session
 * and the notification snackbar.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    mocks = [],
    route = '/',
    routes,
    messages = {},
    locale = 'en',
    user,
    ...options
  }: Readonly<ProviderOptions> = {},
): RenderResult {
  if (user) seedSession(user);
  return render(
    <MockedProvider mocks={mocks}>
      <I18nProvider locale={locale} messages={messages}>
        <ColorModeProvider>
          <MemoryRouter initialEntries={[route]}>
            <AuthProvider>
              <NotificationProvider>
                <Routes>
                  <Route path="*" element={ui} />
                  {routes}
                </Routes>
              </NotificationProvider>
            </AuthProvider>
          </MemoryRouter>
        </ColorModeProvider>
      </I18nProvider>
    </MockedProvider>,
    options,
  );
}
