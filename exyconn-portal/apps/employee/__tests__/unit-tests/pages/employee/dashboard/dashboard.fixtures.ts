/**
 * One employee's workspace on 15 March 2026 (the tests pin the clock there). Dates are
 * local-time strings so "today" and "this month" do not move with the machine's zone.
 */
export const attendance = [
  { id: 'a1', date: '2026-03-15T09:00:00', status: 'HALF_DAY' },
  { id: 'a2', date: '2026-03-02T09:00:00', status: 'PRESENT' },
  { id: 'a3', date: '2026-03-03T09:00:00', status: 'PRESENT' },
  { id: 'a4', date: '2026-03-04T09:00:00', status: 'WFH' },
  { id: 'a5', date: '2026-02-27T09:00:00', status: 'PRESENT' },
];

const leave = { type: 'CL', reason: 'Personal' };

export const leaveRequests = [
  {
    ...leave,
    id: 'l1',
    fromDate: '2026-03-02T00:00:00',
    toDate: '2026-03-03T00:00:00',
    status: 'APPROVED',
  },
  {
    ...leave,
    id: 'l2',
    fromDate: '2026-04-10T00:00:00',
    toDate: '2026-04-10T00:00:00',
    status: 'PENDING',
  },
  {
    ...leave,
    id: 'l3',
    fromDate: '2025-12-22T00:00:00',
    toDate: '2025-12-24T00:00:00',
    status: 'APPROVED',
  },
  {
    ...leave,
    id: 'l4',
    fromDate: '2026-01-05T00:00:00',
    toDate: '2026-01-05T00:00:00',
    status: 'REJECTED',
  },
  {
    ...leave,
    id: 'l5',
    fromDate: '2025-11-03T00:00:00',
    toDate: '2025-11-03T00:00:00',
    status: 'APPROVED',
  },
];

export const holidays = [
  { id: 'h1', name: 'Holi', date: '2026-03-04T00:00:00', type: 'PUBLIC', description: null },
  { id: 'h2', name: 'Good Friday', date: '2026-04-03T00:00:00', type: 'PUBLIC', description: null },
];

export const salarySlips = [
  { id: 's1', month: 12, year: 2025 },
  { id: 's2', month: 2, year: 2026 },
];

export const payroll = { id: 'pay1', net: 75000, currency: 'INR' };

export const tickets = [
  { id: 't1', status: 'OPEN' },
  { id: 't2', status: 'CLOSED' },
  { id: 't3', status: 'IN_PROGRESS' },
];

const announcement = { category: 'GENERAL', publishedAt: '2026-03-10T09:00:00.000Z' };

export const announcements = ['One', 'Two', 'Three', 'Four', 'Five'].map((title, index) => ({
  ...announcement,
  id: `n${title}`,
  title: `Notice ${title}`,
  pinned: index === 0,
}));

export const balances = [
  { id: 'b1', leaveTypeCode: 'CL', year: 2026, available: 4 },
  // Over-used: the balance tile clamps it to zero, the available tile counts it as is.
  { id: 'b2', leaveTypeCode: 'SL', year: 2026, available: -1 },
  { id: 'b3', leaveTypeCode: 'EL', year: 2025, available: 9 },
];
