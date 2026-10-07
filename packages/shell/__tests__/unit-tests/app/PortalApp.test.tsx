import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { PortalApp, RESET_PASSWORD_PATH, UNSUBSCRIBE_PATH } from '@/app/PortalApp';
import { portalLogger } from '@/logging/portalLogger';
import { makeUser, seedSession } from '../test-utils';

vi.mock('@/config/apolloClient', async () => {
  const { ApolloClient, ApolloLink, InMemoryCache } = await import('@apollo/client');
  const { throwError } = await import('rxjs');
  // An API that never answers: the cached session stays, and no company redirect happens.
  const link = new ApolloLink(() => throwError(() => new Error('offline')));
  return { apolloClient: new ApolloClient({ cache: new InMemoryCache(), link }) };
});

vi.mock('@/i18n/PortalI18nProvider', async () => {
  const { I18nProvider } = await import('@exyconn/i18n');
  return {
    PortalI18nProvider: ({ children }: Readonly<{ children: ReactNode }>) => (
      <I18nProvider locale="en" messages={{}}>
        {children}
      </I18nProvider>
    ),
  };
});

vi.mock('@/layout/PortalLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    PortalLayout: () => (
      <div data-testid="portal-layout">
        <Outlet />
      </div>
    ),
  };
});

vi.mock('@/pwa', () => ({ OfflineBanner: () => null, PwaUpdateBanner: () => null }));
vi.mock('@/pages/Profile', () => ({ ProfilePage: () => <p>profile page</p> }));
vi.mock('@/pages/Settings', () => ({ SettingsPage: () => <p>settings page</p> }));
vi.mock('@/pages/Notifications', () => ({ NotificationsPage: () => <p>notifications page</p> }));
vi.mock('@/pages/Approvals', () => ({ ApprovalsPage: () => <p>approvals page</p> }));
vi.mock('@/routes/ExternalRedirect', () => ({
  ExternalRedirect: ({ to }: Readonly<{ to: string }>) => <p>leaving for {to}</p>,
}));
vi.mock('@/logging/portalLogger', () => ({ portalLogger: { setRoute: vi.fn() } }));

const login = <p>login screen</p>;

interface AppOptions {
  chrome?: boolean;
  moduleRole?: 'HR' | 'FINANCE';
  homePath?: string;
  publicRoutes?: ReactNode;
}

function renderAppAt(path: string, options: AppOptions = {}) {
  globalThis.history.pushState(null, '', path);
  return render(
    <PortalApp loginElement={login} {...options}>
      <Route path="/hr" element={<p>hr home</p>} />
    </PortalApp>,
  );
}

afterEach(() => {
  globalThis.history.pushState(null, '', '/');
  vi.mocked(portalLogger.setRoute).mockClear();
});

describe('PortalApp signed out', () => {
  it('sends a visitor to the login screen, remembering where they were going', async () => {
    renderAppAt('/hr?tab=open', { moduleRole: 'HR' });

    expect(await screen.findByText('login screen')).toBeInTheDocument();
    expect(globalThis.location.pathname).toBe('/login');
    expect(new URLSearchParams(globalThis.location.search).get('next')).toBe('/hr?tab=open');
    expect(portalLogger.setRoute).toHaveBeenLastCalledWith('/login');
  });

  it.each([RESET_PASSWORD_PATH, UNSUBSCRIBE_PATH])(
    'serves %s publicly through the login element',
    async (path) => {
      renderAppAt(path);
      expect(await screen.findByText('login screen')).toBeInTheDocument();
      expect(globalThis.location.pathname).toBe(path);
    },
  );

  it('serves an app’s own public routes without signing in', async () => {
    renderAppAt('/demo', { publicRoutes: <Route path="/demo" element={<p>demo chats</p>} /> });
    expect(await screen.findByText('demo chats')).toBeInTheDocument();
  });
});

describe('PortalApp signed in', () => {
  it('wraps the shared pages and the module routes in the portal chrome', async () => {
    seedSession(makeUser({ roles: ['HR'] }));
    renderAppAt('/profile', { moduleRole: 'HR' });

    expect(await screen.findByText('profile page')).toBeInTheDocument();
    expect(screen.getByTestId('portal-layout')).toBeInTheDocument();
  });

  it.each([
    ['/settings', 'settings page'],
    ['/notifications', 'notifications page'],
    ['/approvals', 'approvals page'],
    ['/hr', 'hr home'],
  ])('routes %s to its page', async (path, text) => {
    seedSession(makeUser({ roles: ['HR'] }));
    renderAppAt(path, { moduleRole: 'HR' });
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('falls back to the home path for an unknown address', async () => {
    seedSession(makeUser({ roles: ['HR'] }));
    renderAppAt('/no-such-page', { moduleRole: 'HR', homePath: '/hr' });

    expect(await screen.findByText('hr home')).toBeInTheDocument();
    expect(globalThis.location.pathname).toBe('/hr');
  });

  it('gives a full-screen app its routes without the sidebar and topbar', async () => {
    seedSession(makeUser({ roles: ['HR'] }));
    renderAppAt('/hr', { chrome: false });

    expect(await screen.findByText('hr home')).toBeInTheDocument();
    expect(screen.queryByTestId('portal-layout')).not.toBeInTheDocument();
  });

  it('sends somebody without the module role back to the hub', async () => {
    seedSession(makeUser({ roles: ['EMPLOYEE'] }));
    renderAppAt('/hr', { moduleRole: 'FINANCE' });

    expect(await screen.findByText(/^leaving for /)).toBeInTheDocument();
    expect(screen.queryByText('hr home')).not.toBeInTheDocument();
  });
});
