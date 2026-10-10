import { Types } from 'mongoose';
import { LeaveBalanceModel } from '../../../../src/modules/hrmaster/leaveBalance.model';
import {
  availableOf,
  creditLeaveBalance,
  debitLeaveBalance,
  leaveDays,
} from '../../../../src/modules/hr/leave-balance.service';

const EMP = new Types.ObjectId().toHexString();
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const span = (type: string, from: string, to: string) => ({
  employeeId: EMP,
  type,
  fromDate: day(from),
  toDate: day(to),
});

const balance = (over: Record<string, unknown> = {}) =>
  LeaveBalanceModel.create({
    employeeId: EMP,
    leaveTypeCode: 'CASUAL',
    year: 2026,
    allocated: 10,
    ...over,
  });

const usedOf = async () =>
  (await LeaveBalanceModel.findOne({ employeeId: EMP, leaveTypeCode: 'CASUAL' }).lean())?.used;

describe('leaveDays', () => {
  it('counts calendar days across a month end, ignoring the time of day', () => {
    expect(leaveDays(new Date('2026-01-30T18:00:00.000Z'), day('2026-02-02'))).toBe(4);
  });
});

describe('availableOf', () => {
  it('adds the carry-forward and adjustment to the allocation and takes off what was used', () => {
    expect(availableOf({ allocated: 12, carriedForward: 3, adjustment: -2, used: 5 })).toBe(8);
  });
});

describe('debitLeaveBalance', () => {
  it('leaves balances alone for unpaid leave', async () => {
    await balance();

    await debitLeaveBalance(span('UNPAID', '2026-03-02', '2026-03-06'));

    expect(await usedOf()).toBe(0);
  });

  it('allows a request that uses exactly what is left, counting carry-forward and adjustment', async () => {
    await balance({ allocated: 2, carriedForward: 1, adjustment: 1, used: 1 });

    await debitLeaveBalance(span('CASUAL', '2026-03-02', '2026-03-04'));

    expect(await usedOf()).toBe(4);
  });

  it('charges the balance of the year the leave starts in', async () => {
    await balance({ year: 2025, allocated: 5 });
    await balance({ year: 2026, allocated: 5 });

    await debitLeaveBalance(span('CASUAL', '2025-12-31', '2026-01-01'));

    const rows = await LeaveBalanceModel.find({ employeeId: EMP }).sort({ year: 1 }).lean();
    expect(rows.map((row) => [row.year, row.used])).toEqual([
      [2025, 2],
      [2026, 0],
    ]);
  });
});

describe('creditLeaveBalance', () => {
  it('gives the days of a withdrawn approval back', async () => {
    await balance({ used: 5 });

    await creditLeaveBalance(span('CASUAL', '2026-03-02', '2026-03-03'));

    expect(await usedOf()).toBe(3);
  });

  it('never drives used below zero', async () => {
    await balance({ used: 1 });

    await creditLeaveBalance(span('CASUAL', '2026-03-02', '2026-03-06'));

    expect(await usedOf()).toBe(0);
  });

  it('does nothing for unpaid leave or when there is no balance to credit', async () => {
    await balance({ used: 4 });

    await creditLeaveBalance(span('UNPAID', '2026-03-02', '2026-03-03'));
    await creditLeaveBalance(span('SICK', '2026-03-02', '2026-03-03'));

    expect(await usedOf()).toBe(4);
    expect(await LeaveBalanceModel.countDocuments()).toBe(1);
  });
});
