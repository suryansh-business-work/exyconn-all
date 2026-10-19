import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { countryName } from '@exyconn/i18n';
import { renderWithProviders } from '../../test-utils';
import { UsersSection } from '../../../../src/pages/analytics/UsersSection';
import { EmployeesSection } from '../../../../src/pages/analytics/EmployeesSection';
import { TrackerSection } from '../../../../src/pages/analytics/TrackerSection';
import { drawnLabels, workspace } from './analytics.fixtures';

vi.mock('react-chartjs-2', async () => {
  const { DrawnChart } = await import('./analytics.fixtures');
  return { Bar: DrawnChart, Line: DrawnChart };
});

const report = workspace();

/** The whole stat tile (figure, then label) whose label is `label`. */
function tile(section: HTMLElement, label: string) {
  return within(section).getByText(label).parentElement?.parentElement?.textContent;
}

describe('UsersSection', () => {
  it('shows every account count and charts users by role and by joining day', () => {
    renderWithProviders(<UsersSection users={report.users} />);
    const section = screen.getByRole('region', { name: 'Users' });
    expect(
      within(section).getByText('Every account in the company, and the roles they hold'),
    ).toBeInTheDocument();
    expect(tile(section, 'Online now')).toBe('3Online now');
    expect(tile(section, 'Blocked')).toBe('1Blocked');
    expect(tile(section, 'Joined in period')).toBe('2Joined in period');
    expect(within(section).getByRole('heading', { name: 'Users by role' })).toBeInTheDocument();
    expect(drawnLabels()).toHaveLength(2);
    expect(drawnLabels()[0]).toBe('EMPLOYEE');
  });
});

describe('EmployeesSection', () => {
  it('counts active employees, departments and countries, naming each country', () => {
    renderWithProviders(<EmployeesSection employees={report.employees} />);
    const section = screen.getByRole('region', { name: 'Employees' });
    expect(tile(section, 'Active employees')).toBe('7Active employees');
    expect(tile(section, 'Departments')).toBe('2Departments');
    expect(tile(section, 'Countries')).toBe('2Countries');
    expect(drawnLabels()).toContain(`${countryName('IN')}|Company's country`);
  });

  it('shows zero active employees when nobody is ACTIVE', () => {
    renderWithProviders(
      <EmployeesSection employees={{ ...report.employees, byStatus: [], byCountry: [] }} />,
    );
    const section = screen.getByRole('region', { name: 'Employees' });
    expect(tile(section, 'Active employees')).toBe('0Active employees');
    expect(tile(section, 'Countries')).toBe('0Countries');
  });
});

describe('TrackerSection', () => {
  it('shows tracker access, recorded time and the breakdown charts', () => {
    renderWithProviders(<TrackerSection tracker={report.tracker} />);
    const section = screen.getByRole('region', { name: 'Employee tracker' });
    expect(tile(section, 'Tracker access')).toBe('8Tracker access');
    expect(tile(section, 'Active hours')).toBe('120.3hActive hours');
    expect(tile(section, 'Activity')).toBe('82%Activity');
    expect(tile(section, 'Sessions')).toBe('31Sessions');
    expect(within(section).getByRole('heading', { name: 'Top applications' })).toBeInTheDocument();
    expect(drawnLabels()).toEqual([
      expect.any(String),
      'Asha',
      'VS Code',
      'macOS|Android',
      'ONLINE',
      'PENDING',
    ]);
  });
});
