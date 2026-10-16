import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { AllAppsButton } from '@/layout/PortalLayout/AllAppsButton';
import { renderWithProviders } from '../../test-utils';

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe('AllAppsButton', () => {
  // The test bundle is the hub app (VITE_PORTAL_APP unset), so Portal Home is a client-side hop.
  it('takes the person back to Portal Home, where every app is opened from', async () => {
    renderWithProviders(
      <>
        <AllAppsButton />
        <CurrentPath />
      </>,
      { route: '/settings', messages: { 'All apps': 'Todas las apps' } },
    );
    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent('/settings');

    await userEvent.click(screen.getByRole('button', { name: 'Todas las apps' }));

    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent(/^\/$/);
  });
});
