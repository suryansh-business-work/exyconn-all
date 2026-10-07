import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthUser } from '@exyconn/shell/auth/AuthContext';
import { ROLES, type Role } from '@exyconn/shell/auth/roles';
import { HUB_URL } from '@exyconn/shell/config/apps';
import { AppMenu } from '../../../../../src/components/wa/list/AppMenu';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

const auth = vi.hoisted(() => ({
  value: { user: null as AuthUser | null, signOut: vi.fn() },
  clearVisitorPass: vi.fn(),
}));

vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => auth.value }));
vi.mock('../../../../../src/visitor/visitorPass', () => ({
  clearVisitorPass: auth.clearVisitorPass,
}));

const person = (roles: Role[]): AuthUser => ({
  id: 'u-1',
  name: 'Meera',
  email: 'meera@example.com',
  roles,
});

function UrlProbe() {
  return <p data-testid="url">{useCurrentUrl()}</p>;
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Menu' }));
  return screen.getByRole('menu');
}

function renderMenu(user: AuthUser | null) {
  auth.value = { user, signOut: vi.fn() };
  renderWithProviders(
    <>
      <AppMenu color="#000" />
      <UrlProbe />
    </>,
    { route: '/' },
  );
  return userEvent.setup();
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('AppMenu', () => {
  it('explains the demo in the About dialog', async () => {
    const user = renderMenu(person([ROLES.EMPLOYEE]));
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'About this demo' }));
    const dialog = await screen.findByRole('dialog', { name: 'Exyconn automation demo' });
    expect(dialog).toHaveTextContent('No message leaves this page');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('switches between the dark and light themes', async () => {
    const user = renderMenu(person([ROLES.EMPLOYEE]));
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Dark theme' }));
    await openMenu(user);
    expect(screen.getByRole('menuitem', { name: 'Light theme' })).toBeInTheDocument();
    expect(localStorage.getItem('exyconn-track.color-mode')).toBe('dark');
  });

  it('takes an admin to the demo admin', async () => {
    const user = renderMenu(person([ROLES.ADMIN]));
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Demo admin' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/admin');
  });

  it('offers an employee the way back to the portal but not the admin', async () => {
    const user = renderMenu(person([ROLES.EMPLOYEE]));
    await openMenu(user);
    expect(screen.queryByRole('menuitem', { name: 'Demo admin' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Back to portal' })).toHaveAttribute(
      'href',
      HUB_URL,
    );
  });

  it('signs a portal user out through the portal session', async () => {
    const user = renderMenu(person([ROLES.EMPLOYEE]));
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(auth.value.signOut).toHaveBeenCalledTimes(1);
    expect(auth.clearVisitorPass).not.toHaveBeenCalled();
  });

  it("drops a demo visitor's pass and reloads the sign-in page", async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    const user = renderMenu(null);
    const menu = await openMenu(user);
    expect(menu).not.toHaveTextContent('Back to portal');
    expect(menu).not.toHaveTextContent('Demo admin');
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(auth.clearVisitorPass).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/login');
  });
});
