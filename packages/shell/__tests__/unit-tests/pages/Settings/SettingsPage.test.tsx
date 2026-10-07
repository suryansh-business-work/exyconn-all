import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SettingsPage } from '@/pages/Settings';
import { renderWithProviders } from '../../test-utils';

// Each panel has its own test; the page only lays them out.
vi.mock('@/pages/Settings/forms/change-password', () => ({
  ChangePasswordForm: () => <p>change password form</p>,
}));
vi.mock('@/pages/Settings/TwoFactorPanel', () => ({ TwoFactorPanel: () => <p>two-factor</p> }));
vi.mock('@/pages/Settings/SessionsPanel', () => ({ SessionsPanel: () => <p>sessions</p> }));
vi.mock('@/pages/Settings/NotificationPreferencesPanel', () => ({
  NotificationPreferencesPanel: () => <p>notifications</p>,
}));

describe('SettingsPage', () => {
  it('heads the page and lays out every account panel', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Manage your account security')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
    for (const panel of ['change password form', 'two-factor', 'sessions', 'notifications']) {
      expect(screen.getByText(panel)).toBeInTheDocument();
    }
  });
});
