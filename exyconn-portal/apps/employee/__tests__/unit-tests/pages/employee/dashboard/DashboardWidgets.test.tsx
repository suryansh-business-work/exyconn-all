import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { DashboardTiles } from '../../../../../src/pages/employee/dashboard/DashboardTiles';
import { LatestAnnouncements } from '../../../../../src/pages/employee/dashboard/LatestAnnouncements';
import { RecentLeave } from '../../../../../src/pages/employee/dashboard/RecentLeave';
import { UpcomingHolidays } from '../../../../../src/pages/employee/dashboard/UpcomingHolidays';

const formatDate = (value: string) => `on ${value}`;

describe('DashboardTiles', () => {
  it('renders one tile per figure, or a placeholder for each while loading', () => {
    const stats = [
      { label: 'Today', value: 'PRESENT' },
      { label: 'Open tickets', value: '3' },
    ];
    const { rerender } = renderWithProviders(<DashboardTiles stats={stats} />);
    expect(screen.getByText('PRESENT')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    rerender(<DashboardTiles stats={stats} loading />);
    expect(screen.getByText('Open tickets')).toBeInTheDocument();
    expect(screen.queryByText('3')).toBeNull();
  });
});

describe('LatestAnnouncements', () => {
  it('lists each announcement with its category and date, pinning the pinned one', () => {
    renderWithProviders(
      <LatestAnnouncements
        formatDate={formatDate}
        announcements={[
          {
            id: 'a1',
            title: 'Town hall',
            category: 'EVENT',
            pinned: true,
            publishedAt: '2026-03-01',
          },
          {
            id: 'a2',
            title: 'New canteen',
            category: 'GENERAL',
            pinned: false,
            publishedAt: '2026-03-02',
          },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument();
    expect(screen.getByText('Town hall')).toBeInTheDocument();
    expect(screen.getByText('EVENT')).toBeInTheDocument();
    expect(screen.getByText('on 2026-03-02')).toBeInTheDocument();
    expect(screen.getAllByTestId('PushPinIcon')).toHaveLength(1);
  });

  it('shows a spinner while loading instead of saying nothing is announced', () => {
    renderWithProviders(<LatestAnnouncements formatDate={formatDate} announcements={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Nothing announced right now.')).toBeNull();
  });
});

describe('RecentLeave', () => {
  it('lists each request with its type, dates and status', () => {
    renderWithProviders(
      <RecentLeave
        formatDate={formatDate}
        requests={[
          { id: 'l1', type: 'SL', fromDate: '2026-03-09', toDate: '2026-03-10', status: 'PENDING' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Recent leave' })).toBeInTheDocument();
    expect(screen.getByText('SL · on 2026-03-09 → on 2026-03-10')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('shows a spinner while loading instead of saying there are none', () => {
    renderWithProviders(<RecentLeave formatDate={formatDate} requests={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('No leave requests yet.')).toBeNull();
  });
});

describe('UpcomingHolidays', () => {
  it('lists each holiday with its date and weekday', () => {
    renderWithProviders(
      <UpcomingHolidays
        formatDate={formatDate}
        holidays={[{ id: 'h1', name: 'Good Friday', date: '2026-04-03T00:00:00' }]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Upcoming holidays' })).toBeInTheDocument();
    expect(screen.getByText('Good Friday')).toBeInTheDocument();
    expect(screen.getByText('on 2026-04-03T00:00:00 · Friday')).toBeInTheDocument();
    expect(screen.getByTestId('CelebrationIcon')).toBeInTheDocument();
  });

  it('shows a spinner while loading instead of saying none are scheduled', () => {
    renderWithProviders(<UpcomingHolidays formatDate={formatDate} holidays={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('No holidays scheduled ahead.')).toBeNull();
  });
});
