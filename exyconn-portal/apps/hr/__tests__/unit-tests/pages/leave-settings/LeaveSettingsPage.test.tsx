import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LEAVE_SETTINGS_PATH, LeaveSettingsPage } from '../../../../src/pages/leave-settings';
import { renderWithProviders } from '../../test-utils';
import { UrlProbe } from '../../harness/url-probe';

vi.mock('../../../../src/pages/leave-policies', () => ({
  LeavePoliciesPage: () => <p>Leave types register</p>,
}));
vi.mock('../../../../src/pages/leave-settings/WorkWeekTab', () => ({
  WorkWeekTab: () => <p>Company work week</p>,
}));

function renderAt(route: string) {
  renderWithProviders(
    <>
      <LeaveSettingsPage />
      <UrlProbe />
    </>,
    { route },
  );
}

describe('LeaveSettingsPage', () => {
  it('lives under the HR leave settings route', () => {
    expect(LEAVE_SETTINGS_PATH).toBe('/hr/leave-settings');
  });

  it('opens on the leave types tab, keeping the tab in the URL', async () => {
    renderAt(LEAVE_SETTINGS_PATH);
    expect(await screen.findByLabelText('current url')).toHaveTextContent(
      '/hr/leave-settings/leave-types',
    );
    expect(screen.getByRole('tablist', { name: 'Leave settings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Leave types' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Leave types register');
  });

  it('shows the leave types register when its slug is in the URL', () => {
    renderAt(`${LEAVE_SETTINGS_PATH}/leave-types`);
    expect(screen.getByText('Leave types register')).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent(
      '/hr/leave-settings/leave-types',
    );
  });

  it('offers the work week as its own tab, opened by its slug', () => {
    renderAt(`${LEAVE_SETTINGS_PATH}/work-week`);
    expect(screen.getByRole('tab', { name: 'Work week' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Company work week');
    expect(screen.queryByText('Leave types register')).toBeNull();
  });

  it('moves to the work week tab, keeping it in the URL', async () => {
    renderAt(`${LEAVE_SETTINGS_PATH}/leave-types`);
    await userEvent.click(screen.getByRole('tab', { name: 'Work week' }));
    expect(await screen.findByText('Company work week')).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent('/hr/leave-settings/work-week');
  });
});
