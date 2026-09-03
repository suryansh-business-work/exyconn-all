import { describe, it, expect } from 'vitest';
import {
  todayAttendance,
  pendingLeave,
  newJoiners,
  activeSplit,
} from '../../src/pages/hr/dashboard/hrDashboard.selectors';

const REF = new Date('2026-03-15T10:00:00.000Z');
const users = [
  { id: 'u1', name: 'Asha', joinDate: '2026-03-02T00:00:00.000Z', isActive: true },
  { id: 'u2', name: 'Bilal', joinDate: '2025-11-20T00:00:00.000Z', isActive: true },
  { id: 'u3', name: 'Chen', joinDate: null, isActive: false },
];

describe('todayAttendance', () => {
  it('counts only today, per status', () => {
    const rows = [
      { date: '2026-03-15T09:00:00.000Z', status: 'PRESENT' as const },
      { date: '2026-03-15T09:05:00.000Z', status: 'WFH' as const },
      { date: '2026-03-14T09:00:00.000Z', status: 'PRESENT' as const },
      { date: 'garbage', status: 'ABSENT' as const },
    ];
    expect(todayAttendance(rows, REF)).toEqual({ PRESENT: 1, ABSENT: 0, WFH: 1, HALF_DAY: 0 });
  });
});

describe('pendingLeave', () => {
  it('keeps only PENDING, joins the employee name, oldest first', () => {
    const leave = [
      {
        id: 'l1',
        employeeId: 'u2',
        type: 'SICK',
        fromDate: '2026-03-20',
        toDate: '2026-03-21',
        status: 'PENDING',
      },
      {
        id: 'l2',
        employeeId: 'u1',
        type: 'CASUAL',
        fromDate: '2026-03-16',
        toDate: '2026-03-16',
        status: 'PENDING',
      },
      {
        id: 'l3',
        employeeId: 'u1',
        type: 'EARNED',
        fromDate: '2026-03-01',
        toDate: '2026-03-02',
        status: 'APPROVED',
      },
    ];
    const rows = pendingLeave(leave, users);
    expect(rows.map((r) => [r.id, r.employeeName])).toEqual([
      ['l2', 'Asha'],
      ['l1', 'Bilal'],
    ]);
  });

  it('falls back to the id when the employee is unknown', () => {
    const rows = pendingLeave(
      [
        {
          id: 'l9',
          employeeId: 'ghost',
          type: 'SICK',
          fromDate: '2026-03-20',
          toDate: '2026-03-20',
          status: 'PENDING',
        },
      ],
      users,
    );
    expect(rows[0].employeeName).toBe('ghost');
  });
});

describe('newJoiners', () => {
  it('returns people whose joinDate is in the reference month, ignoring null dates', () => {
    expect(newJoiners(users, REF).map((u) => u.name)).toEqual(['Asha']);
  });
});

describe('activeSplit', () => {
  it('splits the workforce by isActive', () => {
    expect(activeSplit(users)).toEqual({ active: 2, inactive: 1 });
  });
});
