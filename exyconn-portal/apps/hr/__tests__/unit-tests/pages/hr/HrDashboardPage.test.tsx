import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { HrDashboardPage } from '../../../../src/pages/hr';
import { useHrDashboardData } from '../../../../src/pages/hr/dashboard/useHrDashboardData';
import { renderWithProviders } from '../../test-utils';
import { statFigure } from '../../harness/stat-card';

vi.mock('../../../../src/pages/hr/dashboard/useHrDashboardData', () => ({
  useHrDashboardData: vi.fn(),
}));

const ids = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);

const noon = (day: number) => `2026-03-${String(day).padStart(2, '0')}T12:00:00.000Z`;

const pending = ids('Waiting ', 7).map((name, index) => ({
  id: `l${index}`,
  employeeId: `u${index}`,
  employeeName: name,
  type: 'SICK',
  fromDate: noon(20),
  toDate: noon(21),
  status: 'PENDING',
}));

const joiners = ids('Joiner ', 7).map((name, index) => ({
  id: `j${index}`,
  name,
  joinDate: noon(2),
  isActive: true,
}));

const recurring = (prefix: string) =>
  ids(prefix, 5).map((name, index) => ({
    user: { id: `${prefix}${index}`, name, isActive: true },
    on: new Date(noon(16)),
    daysAway: 1,
    years: 3,
  }));

function data(loading = false) {
  return {
    tiles: [
      { label: 'Employees', value: '40' },
      { label: 'On leave', value: '2' },
    ],
    derived: {
      pending,
      joiners,
      nextHolidays: [{ id: 'h1', name: 'Holi', date: noon(4) }],
      anniversaries: recurring('Anniversary '),
      birthdays: recurring('Birthday '),
    },
    headcount: [],
    headcountLoading: false,
    probationRows: ids('Probation ', 7).map((name, index) => ({ id: `p${index}`, name })),
    announcementRows: ids('Notice ', 5).map((title, index) => ({
      id: `a${index}`,
      title,
      category: 'NOTICE',
      pinned: false,
      publishedAt: noon(1),
    })),
    loading: {
      tiles: loading,
      users: loading,
      pendingLeave: loading,
      holidays: loading,
      probations: loading,
      announcements: loading,
    },
  };
}

beforeEach(() => {
  vi.mocked(useHrDashboardData).mockReturnValue(data() as never);
});

describe('HrDashboardPage', () => {
  it('shows the tiles with their figures', () => {
    renderWithProviders(<HrDashboardPage />);
    expect(screen.getByRole('heading', { name: 'HR Dashboard' })).toBeInTheDocument();
    expect(statFigure('Employees')).toBe('40');
    expect(statFigure('On leave')).toBe('2');
  });

  it('keeps each card short: six queued, four of the rest', () => {
    renderWithProviders(<HrDashboardPage />);
    expect(screen.getByText('Waiting 6')).toBeInTheDocument();
    expect(screen.queryByText('Waiting 7')).not.toBeInTheDocument();
    expect(screen.getByText('Joiner 6')).toBeInTheDocument();
    expect(screen.queryByText('Joiner 7')).not.toBeInTheDocument();
    expect(screen.getByText('Probation 6')).toBeInTheDocument();
    expect(screen.queryByText('Probation 7')).not.toBeInTheDocument();
    expect(screen.getByText('Notice 4')).toBeInTheDocument();
    expect(screen.queryByText('Notice 5')).not.toBeInTheDocument();
    expect(screen.getByText('Birthday 4')).toBeInTheDocument();
    expect(screen.queryByText('Birthday 5')).not.toBeInTheDocument();
    expect(screen.getByText('Anniversary 4 · 3 years')).toBeInTheDocument();
    expect(screen.queryByText('Anniversary 5 · 3 years')).not.toBeInTheDocument();
  });

  it('writes every date through the workspace date format', () => {
    renderWithProviders(<HrDashboardPage />);
    expect(screen.getAllByText('20 Mar 2026 → 21 Mar 2026')).toHaveLength(6);
    expect(screen.getAllByText('02 Mar 2026')).toHaveLength(6);
    expect(screen.getAllByText('Tomorrow · 16 Mar 2026')).toHaveLength(8);
    expect(screen.getByText(/^04 Mar 2026 · /)).toBeInTheDocument();
    expect(screen.getByText('Not enough history to chart yet.')).toBeInTheDocument();
  });

  it('shows placeholders on every card until its data arrives', () => {
    vi.mocked(useHrDashboardData).mockReturnValue(data(true) as never);
    renderWithProviders(<HrDashboardPage />);
    expect(statFigure('Employees')).toBe('');
    expect(screen.getAllByRole('status')).toHaveLength(7);
  });
});
