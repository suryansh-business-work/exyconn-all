import { fireEvent, screen } from '@testing-library/react';
import type { AuthUser } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from '../../../../src/components/shell/AppHeader';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/tracker/instance', () => ({ tracker: { setPreferences: vi.fn() } }));

const ASHA: AuthUser = { id: 'u1', name: 'Asha Rao', email: 'asha@example.test' };

describe('AppHeader', () => {
  it("shows the page title and the employee's initials, which open Settings", () => {
    const onOpenAccount = vi.fn();
    renderWithProviders(
      <AppHeader
        title="My Report"
        status="tracking"
        user={ASHA}
        themeMode="light"
        onOpenAccount={onOpenAccount}
      />,
    );
    expect(screen.getByText('My Report')).toBeInTheDocument();
    const avatar = screen.getByRole('button', { name: 'Asha Rao, open settings' });
    expect(avatar).toHaveTextContent('AR');
    fireEvent.click(avatar);
    expect(onOpenAccount).toHaveBeenCalledTimes(1);
  });

  it('carries the theme switch and the recording indicator on every page', () => {
    const onMissing = vi.fn();
    renderWithProviders(
      <AppHeader
        title="Settings"
        status="paused"
        user={ASHA}
        themeMode="dark"
        onOpenAccount={vi.fn()}
      />,
      { themeMode: 'dark', onMissing },
    );
    expect(
      screen.getByRole('button', { name: 'Theme: Dark. Switch to matching your system.' }),
    ).toBeInTheDocument();
    expect(onMissing).toHaveBeenCalledWith('Paused — nothing is being recorded');
  });

  it('still names the avatar before the employee is known', () => {
    renderWithProviders(
      <AppHeader
        title="Dashboard"
        status="idle"
        user={null}
        themeMode="light"
        onOpenAccount={vi.fn()}
      />,
    );
    const avatar = screen.getByRole('button', { name: 'Signed in, open settings' });
    expect(avatar).toHaveTextContent('SI');
  });
});
