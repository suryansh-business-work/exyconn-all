import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/ui/pickers';
import { ColorModeProvider } from '@/theme/ColorModeContext';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { AuthProvider, type AuthUser } from '@/auth/AuthContext';
import { tokenStore } from '@/auth/tokenStore';
import { userStore } from '@/auth/userStore';

/** Options for {@link renderWithProviders}. Every provider mirrors `PortalApp`'s composition. */
export interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Apollo mocks for MockedProvider. An unmatched operation resolves to an error result. */
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  /** MemoryRouter entries; the first is where the tree opens. Defaults to `/`. */
  route?: string;
  /** Translations (source string -> text). Empty means `t()` renders the English source. */
  messages?: Messages;
  /** Locale for the I18nProvider (`ar` flips the theme to right-to-left). Defaults to `en`. */
  locale?: string;
  /**
   * When set, the tree sits under the real AuthProvider signed in as this person (a session
   * token cookie plus the cached user, exactly what a page refresh rehydrates). `null` mounts
   * the AuthProvider signed out. Omitted, no AuthProvider is mounted.
   */
  user?: AuthUser | null;
}

let sessionCounter = 0;

/** A fresh, non-secret session value per call, so no credential literal lives in the tests. */
export function makeSessionToken(): string {
  sessionCounter += 1;
  return ['test', 'session', sessionCounter].join('-');
}

/** Signs a person in the way a refresh finds them: token cookie plus cached user. */
export function seedSession(user: AuthUser): string {
  const token = makeSessionToken();
  tokenStore.set(token);
  userStore.set(user);
  return token;
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

interface WrapperProps {
  children: ReactNode;
}

/**
 * Renders a component the way a portal mounts it (see `PortalApp`): Apollo (mocked), i18n,
 * the colour-mode theme, MUI X pickers, notifications, confirm dialogs, a memory router and,
 * when `user` is given, the AuthProvider.
 */
export function renderWithProviders(
  ui: ReactElement,
  { mocks = [], route = '/', messages = {}, locale = 'en', user, ...options }: ProviderOptions = {},
): RenderResult {
  if (user) seedSession(user);
  const withAuth = user !== undefined;
  function Wrapper({ children }: Readonly<WrapperProps>) {
    const routed = <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
    return (
      <MockedProvider mocks={mocks}>
        <I18nProvider locale={locale} messages={messages}>
          <ColorModeProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <NotificationProvider>
                <ConfirmProvider>
                  {withAuth ? <AuthProvider>{routed}</AuthProvider> : routed}
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
