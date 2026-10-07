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
      'Leave approved',
      'Leave requested',
      'Leave rejected',
      'Public holiday',
    ]);
    expect(
      within(items[4]).getByText(
        'Your leave request was turned down — mark attendance if you worked.',
      ),
    ).toBeInTheDocument();
    expect(within(legend).getByText(/Today has a dark outline\./)).toBeInTheDocument();
  });
});

describe('dayStatusStyle', () => {
  it('orders the legend by precedence: what you marked, then leave, then holidays', () => {
    expect(LEGEND_ORDER).toEqual([
      'PRESENT',
      'ABSENT',
      'LEAVE_APPROVED',
      'LEAVE_PENDING',
      'LEAVE_REJECTED',
      'HOLIDAY',
    ]);
  });

  it('paints each status from the theme palette', () => {
    expect(DAY_STATUS_STYLE.PRESENT.tone).toBe('success.main');
    expect(DAY_STATUS_STYLE.LEAVE_REJECTED.tone).toBe('error.main');
    expect(DAY_STATUS_STYLE.HOLIDAY.tone).toBe('info.main');
  });
});
