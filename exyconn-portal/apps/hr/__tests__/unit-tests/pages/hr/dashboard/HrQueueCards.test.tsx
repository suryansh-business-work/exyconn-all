import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { format } from 'date-fns';
import { HrAnnouncements } from '../../../../../src/pages/hr/dashboard/HrAnnouncements';
import { HrPendingLeave } from '../../../../../src/pages/hr/dashboard/HrPendingLeave';
import { HrProbations } from '../../../../../src/pages/hr/dashboard/HrProbations';
import { HrUpcomingHolidays } from '../../../../../src/pages/hr/dashboard/HrUpcomingHolidays';
import { renderWithProviders } from '../../../test-utils';

const formatDate = (value: string) => `on ${value}`;

describe('HrAnnouncements', () => {
  it('shows a spinner while they load, and an empty note once there are none', () => {
    const { unmount } = renderWithProviders(
      <HrAnnouncements rows={[]} formatDate={formatDate} loading />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    unmount();

    renderWithProviders(<HrAnnouncements rows={[]} formatDate={formatDate} />);
    expect(screen.getByText('Nothing published right now.')).toBeInTheDocument();
  });

  it('lists each announcement with its category and date, marking the pinned ones', () => {
    renderWithProviders(
      <HrAnnouncements
        formatDate={formatDate}
        rows={[
          { id: 'a1', title: 'Office move', category: 'NOTICE', pinned: true, publishedAt: 'd1' },
          { id: 'a2', title: 'Quiz night', category: 'EVENT', pinned: false, publishedAt: 'd2' },
        ]}
      />,
    );
    expect(screen.getByText('Office move')).toBeInTheDocument();
    expect(screen.getByText('NOTICE')).toBeInTheDocument();
    expect(screen.getByText('on d2')).toBeInTheDocument();
    expect(screen.getAllByTestId('PushPinIcon')).toHaveLength(1);
  });
});

describe('HrPendingLeave', () => {
  it('shows a spinner while it loads, and says when nothing waits', () => {
    const { unmount } = renderWithProviders(
      <HrPendingLeave rows={[]} formatDate={formatDate} loading />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    unmount();

    renderWithProviders(<HrPendingLeave rows={[]} formatDate={formatDate} />);
    expect(screen.getByText('Nothing waiting on you.')).toBeInTheDocument();
  });

  it('lists who is waiting, for which days and which type', () => {
    renderWithProviders(
      <HrPendingLeave
        formatDate={formatDate}
        rows={[
          {
            id: 'l1',
            employeeId: 'u1',
            employeeName: 'Asha Rao',
            type: 'SICK',
            fromDate: 'mon',
            toDate: 'tue',
            status: 'PENDING',
          },
        ]}
      />,
    );
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('on mon → on tue')).toBeInTheDocument();
    expect(screen.getByText('SICK')).toBeInTheDocument();
  });
});

describe('HrProbations', () => {
  it('shows a spinner while it loads, and says when nobody is due', () => {
    const { unmount } = renderWithProviders(
      <HrProbations rows={[]} formatDate={formatDate} loading />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    unmount();

    renderWithProviders(<HrProbations rows={[]} formatDate={formatDate} />);
    expect(screen.getByText('Nobody’s probation ends in the next 30 days.')).toBeInTheDocument();
  });

  it('gives the end date and designation, or a dash and nothing when unknown', () => {
    renderWithProviders(
      <HrProbations
        formatDate={formatDate}
        rows={[
          { id: 'u1', name: 'Asha', designation: 'Engineer', probationEndDate: 'apr' },
          { id: 'u2', name: 'Bilal', designation: null, probationEndDate: null },
        ]}
      />,
    );
    expect(screen.getByText('on apr · Engineer')).toBeInTheDocument();
    expect(screen.getByText('Bilal').nextElementSibling?.textContent).toBe('—');
  });
});

describe('HrUpcomingHolidays', () => {
  it('shows a spinner while they load, and says when none are scheduled', () => {
    const { unmount } = renderWithProviders(
      <HrUpcomingHolidays holidays={[]} formatDate={formatDate} loading />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    unmount();

    renderWithProviders(<HrUpcomingHolidays holidays={[]} formatDate={formatDate} />);
    expect(screen.getByText('No holidays scheduled ahead.')).toBeInTheDocument();
  });

  it('names each holiday with its date and weekday', () => {
    const date = '2026-03-04T12:00:00.000Z';
    renderWithProviders(
      <HrUpcomingHolidays formatDate={formatDate} holidays={[{ id: 'h1', name: 'Holi', date }]} />,
    );
    expect(screen.getByText('Holi')).toBeInTheDocument();
    expect(screen.getByText(`on ${date} · ${format(new Date(date), 'EEEE')}`)).toBeInTheDocument();
  });
});
