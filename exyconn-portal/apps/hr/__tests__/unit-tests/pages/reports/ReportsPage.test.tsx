import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportsPage } from '../../../../src/pages/reports';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

vi.mock('../../../../src/pages/reports/ReportPanel', async () => ({
  ReportPanel: (await import('./panel-stub')).PanelStub,
}));

function UrlProbe() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

function renderAt(route: string) {
  renderWithProviders(
    <>
      <ReportsPage />
      <UrlProbe />
    </>,
    { route },
  );
}

const url = () => screen.getByRole('status', { name: 'url' });

describe('ReportsPage', () => {
  it('offers one tab per HR report, in order', () => {
    renderAt('/hr/reports/employees');

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Employees',
      'Headcount by department',
      'Attendance',
      'Leave',
      'Holidays',
      'Employee requests',
      'Goals',
      'Performance',
      'Training',
      'Exits',
    ]);
  });

  it('opens the first report when the URL names none', async () => {
    renderAt('/hr/reports');

    expect(await screen.findByText('Panel for employees')).toBeInTheDocument();
    expect(url()).toHaveTextContent('/hr/reports/employees');
  });

  it('opens the report the URL names', () => {
    renderAt('/hr/reports/exits');

    expect(screen.getByText('Panel for exits')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Exits' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches report from its tab and keeps the choice in the URL', async () => {
    renderAt('/hr/reports/employees');

    await userEvent.click(screen.getByRole('tab', { name: 'Goals' }));

    expect(screen.getByText('Panel for goals')).toBeInTheDocument();
    expect(url()).toHaveTextContent('/hr/reports/goals');
  });
});
