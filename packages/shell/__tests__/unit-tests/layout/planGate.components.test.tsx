import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import { HUB_URL } from '@/config/apps';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { Sidebar } from '@/layout/PortalLayout/Sidebar';
import { AccountMenu } from '@/layout/PortalLayout/AccountMenu';
import { PortalSwitcher } from '@/layout/PortalSwitcher';
import { makeUser, renderWithProviders } from '../test-utils';

/** A company whose plan opens only the CRM besides Admin and My Workspace. */
const CRM_PLAN = [ROLES.CRM];
const replace = vi.fn();

beforeEach(() => {
  replace.mockReset();
  vi.stubGlobal('location', { ...globalThis.location, replace });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function gate(planRoles: typeof CRM_PLAN | null, requiredRole: 'FINANCE' | 'CRM') {
  renderWithProviders(
    <Routes>
      <Route
        path="*"
        element={
          <ProtectedRoute requiredRole={requiredRole}>
            <p>Module page</p>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { user: makeUser({ roles: [ROLES.ADMIN], planRoles }), route: '/x' },
  );
}

describe('ProtectedRoute and the plan', () => {
  it('sends an ADMIN to the hub from a module the plan leaves out', () => {
    gate(CRM_PLAN, 'FINANCE');

    expect(screen.queryByText('Module page')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(HUB_URL);
  });

  it('lets an ADMIN into a module the plan includes, or any module with no plan limit', () => {
    gate(CRM_PLAN, 'CRM');
    expect(screen.getByText('Module page')).toBeInTheDocument();
  });

  it('applies no limit when the company has no plan', () => {
    gate(null, 'FINANCE');
    expect(screen.getByText('Module page')).toBeInTheDocument();
  });
});

describe('the hub sidebar and the plan', () => {
  it('lists only the modules the plan opens', () => {
    renderWithProviders(<Sidebar roles={[ROLES.ADMIN]} planRoles={CRM_PLAN} />, { route: '/' });

    expect(screen.getByRole('button', { name: 'CRM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finance' })).not.toBeInTheDocument();
  });
});

describe('the portal switcher and the plan', () => {
  it('offers only the portals the plan opens', () => {
    renderWithProviders(
      <PortalSwitcher roles={[ROLES.ADMIN]} planRoles={CRM_PLAN} open onClose={vi.fn()} />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Other Portals' });

    expect(within(dialog).getByRole('button', { name: /^CRM/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /^Finance/ })).not.toBeInTheDocument();
  });
});

describe('the account menu and the plan', () => {
  it('hides Integrations (a CRM page) when the plan leaves the CRM out', () => {
    renderWithProviders(<AccountMenu anchorEl={document.body} onClose={vi.fn()} />, {
      user: makeUser({ roles: [ROLES.ADMIN], planRoles: [ROLES.HR] }),
    });

    expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Integrations' })).not.toBeInTheDocument();
  });

  it('shows Integrations when the plan includes the CRM', () => {
    renderWithProviders(<AccountMenu anchorEl={document.body} onClose={vi.fn()} />, {
      user: makeUser({ roles: [ROLES.ADMIN], planRoles: CRM_PLAN }),
    });

    expect(screen.getByRole('menuitem', { name: 'Integrations' })).toBeInTheDocument();
  });
});
