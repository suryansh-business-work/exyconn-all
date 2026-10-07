import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROLES, type Role } from '@/auth/roles';
import { MODULES } from '@/config/modules';
import { PortalSwitcher } from '@/layout/PortalSwitcher';
import { renderWithProviders } from '../../test-utils';

function showSwitcher(roles: Role[] | null) {
  const onClose = vi.fn();
  renderWithProviders(<PortalSwitcher roles={roles} open onClose={onClose} />);
  const dialog = screen.getByRole('dialog', { name: 'Other Portals' });
  return {
    onClose,
    dialog,
    search: within(dialog).getByRole('textbox', { name: 'Search portals' }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the portal switcher', () => {
  it('lists every portal on the login screen and says signing in opens one', () => {
    const { dialog } = showSwitcher(null);

    const count = MODULES.length + 1;
    expect(within(dialog).getByText(`${count} portals — sign in to open one`)).toBeInTheDocument();
    expect(within(dialog).getAllByRole('button')).toHaveLength(count);
  });

  it('says "portal" for a single match on the login screen', async () => {
    const user = userEvent.setup();
    const { dialog, search } = showSwitcher(null);

    await user.type(search, 'module launcher');

    expect(within(dialog).getByText('1 portal — sign in to open one')).toBeInTheDocument();
  });

  it('lists only what the roles can open once signed in', async () => {
    const user = userEvent.setup();
    const { dialog, search } = showSwitcher([ROLES.ADMIN]);

    expect(within(dialog).getByText(/portals available to you$/)).toBeInTheDocument();

    await user.type(search, 'module launcher');
    expect(within(dialog).getByText('1 portal available to you')).toBeInTheDocument();
  });

  it('marks the portal it is standing in as current', () => {
    const { dialog } = showSwitcher([ROLES.ADMIN]);

    const home = within(dialog).getByRole('button', { name: /Portal Home/ });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(within(home).getByText('Current')).toBeInTheDocument();
    const other = within(dialog).getByRole('button', { name: /^Admin/ });
    expect(other).not.toHaveAttribute('aria-current');
  });

  it('says so when no portal matches the search', async () => {
    const user = userEvent.setup();
    const { dialog, search } = showSwitcher([ROLES.ADMIN]);

    await user.type(search, 'zzqx');

    expect(within(dialog).getByText('No portal matches “zzqx”.')).toBeInTheDocument();
    expect(within(dialog).getByText('0 portals available to you')).toBeInTheDocument();
    expect(within(dialog).queryAllByRole('button')).toHaveLength(0);
  });

  it('only closes when the current portal is picked', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    const user = userEvent.setup();
    const { dialog, onClose } = showSwitcher([ROLES.ADMIN]);

    await user.click(within(dialog).getByRole('button', { name: /Portal Home/ }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it('loads another portal in full', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    const user = userEvent.setup();
    const { dialog, onClose } = showSwitcher([ROLES.ADMIN]);
    const finance = MODULES.find((module) => module.key === 'finance')!;

    await user.click(within(dialog).getByRole('button', { name: /^Finance/ }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`${finance.path}$`)));
  });
});
