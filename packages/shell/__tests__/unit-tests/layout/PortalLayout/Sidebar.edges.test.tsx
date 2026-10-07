import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROLES, type Role } from '@/auth/roles';
import { Sidebar } from '@/layout/PortalLayout/Sidebar';
import { renderWithProviders } from '../../test-utils';

/** Which bundle the sidebar believes it is; each test picks one. */
const bundle = vi.hoisted(() => ({ app: 'hr' }));

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env')>();
  return {
    env: {
      ...actual.env,
      get portalApp() {
        return bundle.app;
      },
    },
  };
});
vi.mock('@/layout/PortalSwitcher', () => ({ PortalSwitcher: () => null }));
vi.mock('@/hooks/useBrandMark', () => ({
  useBrandMark: () => '/brand-mark.svg',
  useBrandLogo: () => '/brand-logo.svg',
}));

function showSidebar(app: string, roles: Role[], collapsed = false) {
  bundle.app = app;
  renderWithProviders(<Sidebar roles={roles} collapsed={collapsed} />, { route: `/${app}` });
}

afterEach(() => {
  bundle.app = 'hr';
});

describe('a module app the roles cannot open', () => {
  it('shows no module heading and no pages', () => {
    showSidebar('finance', [ROLES.HR]);

    expect(screen.getByRole('searchbox', { name: 'Search pages…' })).toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Other Portals',
    ]);
  });

  it('says no page matched a search', async () => {
    const user = userEvent.setup();
    showSidebar('finance', [ROLES.HR]);

    await user.type(screen.getByRole('searchbox', { name: 'Search pages…' }), 'pay');

    expect(screen.getByText('No page matches “pay”.')).toBeInTheDocument();
  });
});

describe('a rail with nobody to expand it', () => {
  it('stays a rail when a section is clicked', async () => {
    const user = userEvent.setup();
    showSidebar('hr', [ROLES.ADMIN], true);

    await user.click(screen.getByRole('button', { name: 'People' }));

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand sidebar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'People' })).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByText('Employee Records')).not.toBeInTheDocument();
  });
});
