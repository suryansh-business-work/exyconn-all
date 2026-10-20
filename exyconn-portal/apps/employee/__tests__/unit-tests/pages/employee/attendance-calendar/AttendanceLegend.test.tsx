import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { AttendanceLegend } from '../../../../../src/pages/employee/attendance-calendar/AttendanceLegend';
import {
  DAY_STATUS_STYLE,
  LEGEND_ORDER,
} from '../../../../../src/pages/employee/attendance-calendar/dayStatusStyle';

describe('AttendanceLegend', () => {
  it('lists every status in the order a day is coloured, each with what it means', () => {
    renderWithProviders(<AttendanceLegend />);
    const legend = screen.getByRole('region', { name: 'Calendar colours' });
    expect(
      within(legend).getByRole('heading', { name: 'What the colours mean' }),
    ).toBeInTheDocument();

    const items = within(legend).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('span')?.textContent)).toEqual([
      'Attendance marked',
      'Absent',
      'Public holiday',
      'Week off',
      'Leave approved',
      'Leave requested',
      'Leave rejected',
    ]);
    expect(
      within(items[3]).getByText('A day outside your working week. Nothing to mark.'),
    ).toBeInTheDocument();
    expect(
      within(items[6]).getByText(
        'Your leave request was turned down — mark attendance if you worked.',
      ),
    ).toBeInTheDocument();
    expect(
      within(legend).getByText(
        /What you marked comes first, then a holiday, then your week off, then leave/,
      ),
    ).toBeInTheDocument();
    expect(within(legend).getByText(/Today has a dark outline\./)).toBeInTheDocument();
  });
});

describe('dayStatusStyle', () => {
  it('orders the legend by precedence: what you marked, a holiday, the week off, then leave', () => {
    expect(LEGEND_ORDER).toEqual([
      'PRESENT',
      'ABSENT',
      'HOLIDAY',
      'WEEK_OFF',
      'LEAVE_APPROVED',
      'LEAVE_PENDING',
      'LEAVE_REJECTED',
    ]);
  });

  it('paints each status from the theme palette', () => {
    expect(DAY_STATUS_STYLE.PRESENT.tone).toBe('success.main');
    expect(DAY_STATUS_STYLE.LEAVE_REJECTED.tone).toBe('error.main');
    expect(DAY_STATUS_STYLE.HOLIDAY.tone).toBe('info.main');
    expect(DAY_STATUS_STYLE.WEEK_OFF.tone).toBe('text.secondary');
  });
});
