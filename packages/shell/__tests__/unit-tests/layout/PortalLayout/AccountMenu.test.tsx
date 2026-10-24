import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import { AccountMenu, INTEGRATIONS_PATH } from '@/layout/PortalLayout/AccountMenu';
import { makeUser, renderWithProviders } from '../../test-utils';

// Inside the CRM portal the CRM's own page is a route away (appUrl answers a relative path).
vi.mock('@/config/apps', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  appUrl: (_app: string, path: string) => path,
}));

function Where() {
  return <output aria-label="location">{useLocation().pathname}</output>;
}

describe('AccountMenu', () => {
  it('opens the integrations in place inside the CRM portal', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <>
        <AccountMenu anchorEl={document.body} onClose={onClose} />
        <Where />
      </>,
      { user: makeUser({ roles: [ROLES.CRM] }), route: '/deals' },
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Integrations' }));

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByRole('status', { name: 'location', hidden: true })).toHaveTextContent(
      INTEGRATIONS_PATH,
    );
  });
});
