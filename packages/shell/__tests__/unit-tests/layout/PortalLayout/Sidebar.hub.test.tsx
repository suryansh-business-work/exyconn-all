import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import { Sidebar } from '@/layout/PortalLayout/Sidebar';
import { renderWithProviders } from '../../test-utils';

/** The hub bundle (VITE_PORTAL_APP unset): the sidebar lists every module the roles open. */
function showHub(route = '/', onNavigate = vi.fn()) {
  renderWithProviders(<Sidebar roles={[ROLES.ADMIN]} onNavigate={onNavigate} />, { route });
  return onNavigate;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the hub sidebar', () => {
  it('searches modules, with no module heading above them', () => {
    showHub();

    expect(screen.getByRole('searchbox', { name: 'Search modules…' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finance' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('says no module matched a search that found nothing', async () => {
    const user = userEvent.setup();
    showHub();

    await user.type(screen.getByRole('searchbox', { name: 'Search modules…' }), 'zzqx');

    expect(screen.getByText('No modules match “zzqx”.')).toBeInTheDocument();
  });

  it('opens a page of another module in full, and tells the drawer to close', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    const user = userEvent.setup();
    const onNavigate = showHub();

    await user.click(screen.getByRole('button', { name: 'Finance' }));
    await user.click(screen.getByRole('button', { name: 'Invoices' }));

    expect(assign).toHaveBeenCalledWith(expect.stringMatching(/\/finance\/invoices$/));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('highlights a module from a site-scoped address as the module itself', () => {
    showHub('/website/s/exyconn/pages');

    expect(screen.getByRole('button', { name: 'Website' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('opens and closes the portal switcher', async () => {
    const user = userEvent.setup();
    showHub();

    await user.click(screen.getByRole('button', { name: 'Other Portals' }));
    const switcher = await screen.findByRole('dialog', { name: 'Other Portals' });
    expect(within(switcher).getByRole('textbox', { name: 'Search portals' })).toBeVisible();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Other Portals' })).not.toBeInTheDocument(),
    );
  });
});
