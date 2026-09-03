import { describe, it, expect } from 'vitest';
import {
  todayAttendance,
  pendingLeave,
  newJoiners,
  activeSplit,
  upcomingAnniversaries,
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

describe('upcomingAnniversaries', () => {
  const today = new Date('2026-03-15T00:00:00.000Z');
  it('finds anniversaries in the window, soonest first, with completed years', () => {
    const rows = [
      { id: 'a', name: 'Asha', joinDate: '2024-03-20T00:00:00.000Z', isActive: true }, // 2 years, in 5 days
      { id: 'b', name: 'Bilal', joinDate: '2021-03-16T00:00:00.000Z', isActive: true }, // 5 years, tomorrow
      { id: 'c', name: 'Chen', joinDate: '2020-06-01T00:00:00.000Z', isActive: true }, // outside 30 days
      { id: 'd', name: 'Dev', joinDate: '2025-03-14T00:00:00.000Z', isActive: true }, // passed yesterday -> next year
    ];
    const out = upcomingAnniversaries(rows, today);
    expect(out.map((a) => [a.user.id, a.years, a.daysAway])).toEqual([
      ['b', 5, 1],
      ['a', 2, 5],
    ]);
  });

  it('skips inactive people, null join dates, and this year’s new joiners', () => {
    const rows = [
      { id: 'x', name: 'X', joinDate: '2024-03-16T00:00:00.000Z', isActive: false },
      { id: 'y', name: 'Y', joinDate: null, isActive: true },
      { id: 'z', name: 'Z', joinDate: '2026-03-15T00:00:00.000Z', isActive: true },
    ];
    expect(upcomingAnniversaries(rows, today)).toEqual([]);
  });

  it('wraps a December anniversary seen from late November into the window', () => {
    const rows = [{ id: 'w', name: 'W', joinDate: '2019-12-05T00:00:00.000Z', isActive: true }];
    const out = upcomingAnniversaries(rows, new Date('2026-11-25T00:00:00.000Z'));
    expect(out).toHaveLength(1);
    expect(out[0].daysAway).toBe(10);
    expect(out[0].years).toBe(7);
  });
});
