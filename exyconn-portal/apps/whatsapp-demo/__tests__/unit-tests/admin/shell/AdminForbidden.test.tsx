import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminForbidden } from '../../../../src/admin/shell/AdminForbidden';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

describe('AdminForbidden', () => {
  it('says the area is for administrators and titles the tab', () => {
    renderWithProviders(<AdminForbidden />, { route: '/admin/sessions' });
    expect(screen.getByRole('heading', { name: 'Admins only', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/open to company administrators only/)).toBeInTheDocument();
    expect(document.title).toContain('Admins only');
  });

  it('leads back to the demo', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <AdminForbidden />
        <Url />
      </>,
      { route: '/admin/sessions' },
    );
    await user.click(screen.getByRole('button', { name: 'Back to the demo' }));
    expect(screen.getByRole('status', { name: 'url' })).toHaveTextContent('/whatsapp-demo');
  });
});
