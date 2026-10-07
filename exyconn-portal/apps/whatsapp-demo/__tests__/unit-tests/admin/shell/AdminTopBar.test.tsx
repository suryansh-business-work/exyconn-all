import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthUser } from '@exyconn/shell/auth/AuthContext';
import { ROLES } from '@exyconn/shell/auth/roles';
import { AdminTopBar } from '../../../../src/admin/shell/AdminTopBar';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const person = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'u-1',
  name: '  priya   ravi  shankar ',
  email: 'priya@example.com',
  roles: [ROLES.ADMIN],
  ...overrides,
});

describe('AdminTopBar', () => {
  it('names the area and who is signed in, with initials when there is no photo', () => {
    renderWithProviders(<AdminTopBar user={person()} />);
    expect(screen.getByRole('heading', { name: 'WhatsApp demo admin' })).toBeInTheDocument();
    expect(screen.getByText('priya@example.com')).toBeInTheDocument();
    // The first two words, upper-cased; the surrounding spaces add nothing.
    expect(screen.getByText('PR')).toBeInTheDocument();
  });

  it('shows the photo when the person has one', () => {
    renderWithProviders(
      <AdminTopBar user={person({ name: 'Priya', avatarUrl: 'https://cdn.example.com/p.png' })} />,
    );
    expect(screen.getByRole('img', { name: 'Priya' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/p.png',
    );
  });

  it('goes back to the demo', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <AdminTopBar user={person({ avatarUrl: null })} />
        <Url />
      </>,
      { route: '/admin/analytics' },
    );
    await user.click(screen.getByRole('button', { name: 'Back to the demo' }));
    expect(screen.getByRole('status', { name: 'url' })).toHaveTextContent('/whatsapp-demo');
  });
});
