import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROLES, roleList } from '@/auth/roles';
import {
  MyPendingApprovalCountDocument,
  MyUnreadNotificationCountDocument,
} from '@/graphql/generated';
import { Topbar } from '@/layout/PortalLayout/Topbar';
import { makeUser, renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';

const BELLS = [
  answer(MyPendingApprovalCountDocument, { myPendingApprovalCount: 0 }).mock,
  answer(MyUnreadNotificationCountDocument, { myUnreadNotificationCount: 0 }).mock,
];

const asha = makeUser({ roles: [ROLES.ADMIN, ROLES.HR] });

function Where() {
  return <output aria-label="location">{useLocation().pathname}</output>;
}

function showTopbar(user: ReturnType<typeof makeUser> | null = asha) {
  const onMenuClick = vi.fn();
  renderWithProviders(
    <>
      <Topbar drawerWidth={288} onMenuClick={onMenuClick} />
      <Where />
    </>,
    { mocks: BELLS, user, route: '/hr' },
  );
  return onMenuClick;
}

const where = () => screen.getByRole('status', { name: 'location', hidden: true });

async function openAccountMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Account menu' }));
  return user;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the topbar', () => {
  it('shows who is signed in and in which roles', () => {
    showTopbar();

    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText(roleList(asha.roles, (text) => text))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveTextContent('A');
  });

  it('shows the photo when the person has one', () => {
    showTopbar(makeUser({ avatarUrl: 'https://cdn.example.com/asha.png' }));

    const photo = screen.getByRole('button', { name: 'Account menu' }).querySelector('img');
    expect(photo).toHaveAttribute('src', 'https://cdn.example.com/asha.png');
  });

  it('asks the layout to open the navigation', async () => {
    const onMenuClick = showTopbar();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('flips the colour mode', async () => {
    showTopbar();
    const user = userEvent.setup();
    const toggle = screen.getByRole('button', { name: 'Toggle colour mode' });
    expect(toggle.querySelector('[data-testid="DarkModeIcon"]')).not.toBeNull();

    await user.click(toggle);

    expect(toggle.querySelector('[data-testid="LightModeIcon"]')).not.toBeNull();
  });

  it('opens the command palette from the search button', async () => {
    showTopbar();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Search…/ }));

    expect(await screen.findByRole('textbox', { name: 'Search the portal' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('leaves the search button off a phone', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
    showTopbar();

    expect(screen.queryByRole('button', { name: /Search…/ })).not.toBeInTheDocument();
  });

  it('shows the account address and goes to the profile', async () => {
    showTopbar();
    const user = await openAccountMenu();

    expect(screen.getByRole('menuitem', { name: 'asha@example.com' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('menuitem', { name: 'Profile' }));

    expect(where()).toHaveTextContent('/profile');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('goes to the settings', async () => {
    showTopbar();
    const user = await openAccountMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Settings' }));

    expect(where()).toHaveTextContent('/settings');
  });

  it('signs out and lands on the login screen', async () => {
    showTopbar();
    const user = await openAccountMenu();

    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(where()).toHaveTextContent('/login');
    expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument();
  });

  it('closes the account menu on Escape', async () => {
    showTopbar();
    const user = await openAccountMenu();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('offers to install the app only once the browser says it can', async () => {
    showTopbar();
    let user = await openAccountMenu();
    expect(screen.queryByRole('menuitem', { name: 'Install app' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    const prompt = vi.fn().mockResolvedValue(undefined);
    const offer = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    act(() => {
      globalThis.dispatchEvent(offer);
    });
    user = await openAccountMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Install app' }));

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('draws an empty account for somebody signed out', () => {
    showTopbar(null);

    expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Search…/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveTextContent('');
  });
});
