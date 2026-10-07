import { describe, expect, it } from 'vitest';
import { pendingLeave } from '../../../../../src/pages/hr/dashboard/hrDashboard.selectors';

const request = (id: string, fromDate: string) => ({
  id,
  employeeId: 'u1',
  type: 'SICK',
  fromDate,
  toDate: fromDate,
  status: 'PENDING',
});

describe('pendingLeave ordering', () => {
  it('puts requests with an unreadable start date first, as the oldest', () => {
    const rows = pendingLeave(
      [request('dated', '2026-03-20'), request('broken', 'not a date'), request('blank', '')],
      [{ id: 'u1', name: 'Asha', isActive: true }],
    );
    expect(rows.map((row) => row.id)).toEqual(['broken', 'blank', 'dated']);
  });
});
