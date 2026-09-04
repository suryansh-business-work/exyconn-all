import { UserModel } from '../../src/modules/admin/user.model';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import { TrackerIntervalModel } from '../../src/modules/tracker/models';
import { trackerBillingService } from '../../src/modules/tracker/tracker.billing.service';
import { monthlyEarnings } from '../../src/modules/payroll/payroll.compute';

const FROM = new Date('2026-09-01T00:00:00.000Z');
const TO = new Date('2026-10-01T00:00:00.000Z');
const HOUR_MS = 3_600_000;

async function employee(name: string, email: string) {
  const user = await UserModel.create({ name, email, passwordHash: 'x' });
  return String(user._id);
}

async function tracked(userId: string, startedAt: Date, activeMs: number) {
  await TrackerIntervalModel.create({
    userId,
    sessionId: `s-${userId}-${startedAt.getTime()}`,
    startedAt,
    endedAt: new Date(startedAt.getTime() + activeMs),
    activeMs,
    idleMs: 0,
    keyCount: 0,
    mouseCount: 0,
    activityPercent: 100,
  });
}

describe('how each pay type becomes a month', () => {
  it('keeps the components for a FIXED salary', () => {
    const parts = monthlyEarnings({
      payType: 'FIXED',
      basic: 50_000,
      hra: 20_000,
      allowances: 5_000,
      deductions: 2_000,
    });
    expect(parts).toEqual({ basic: 50_000, hra: 20_000, allowances: 5_000, deductions: 2_000 });
  });

  it('treats a stipend as the whole monthly figure, so unpaid leave still prorates it', () => {
    expect(monthlyEarnings({ payType: 'STIPEND', rate: 15_000, deductions: 500 })).toEqual({
      basic: 15_000,
      hra: 0,
      allowances: 0,
      deductions: 500,
    });
  });

  it('earns an HOURLY employee nothing monthly — they are paid for hours tracked', () => {
    // Anything else would invent a salary nobody agreed to.
    expect(monthlyEarnings({ payType: 'HOURLY', rate: 800, basic: 999 })).toEqual({
      basic: 0,
      hra: 0,
      allowances: 0,
      deductions: 0,
    });
  });

  it('reads a structure written before payType existed exactly as it behaved: FIXED', () => {
    expect(monthlyEarnings({ basic: 40_000, hra: 10_000 })).toMatchObject({ basic: 40_000 });
  });
});

describe('tracker billing', () => {
  it('prices tracked hours at the rate on the employee’s HR salary structure', async () => {
    const id = await employee('Asha', 'asha@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: id,
      currency: 'INR',
      payType: 'HOURLY',
      rate: 700,
      billingRate: 1_200,
      effectiveFrom: FROM,
    });
    await tracked(id, new Date('2026-09-04T09:00:00.000Z'), 2 * HOUR_MS);
    await tracked(id, new Date('2026-09-05T09:00:00.000Z'), 1.5 * HOUR_MS);

    const billing = await trackerBillingService.billing(FROM, TO);

    expect(billing.rows).toHaveLength(1);
    expect(billing.rows[0]).toMatchObject({ name: 'Asha', hours: 3.5, amount: 4_200, rated: true });
    expect(billing.totalAmount).toBe(4_200);
  });

  it('bills a FIXED employee too — the rate is theirs, not the pay type’s', async () => {
    const id = await employee('Ravi', 'ravi@exyconn.com');
    await SalaryStructureModel.create({
      employeeId: id,
      currency: 'INR',
      payType: 'FIXED',
      basic: 60_000,
      billingRate: 900,
      effectiveFrom: FROM,
    });
    await tracked(id, new Date('2026-09-04T09:00:00.000Z'), 4 * HOUR_MS);

    const billing = await trackerBillingService.billing(FROM, TO);

    expect(billing.rows[0]).toMatchObject({ payType: 'FIXED', hours: 4, amount: 3_600 });
  });

  it('shows hours with no rate as unrated rather than as free work', async () => {
    const id = await employee('Meera', 'meera@exyconn.com');
    await tracked(id, new Date('2026-09-04T09:00:00.000Z'), HOUR_MS);

    const billing = await trackerBillingService.billing(FROM, TO);

    expect(billing.rows[0]).toMatchObject({ hours: 1, amount: 0, rated: false });
  });

  it('counts only the intervals inside the range', async () => {
    const id = await employee('Sam', 'sam@exyconn.com');
    await tracked(id, new Date('2026-09-04T09:00:00.000Z'), HOUR_MS);
    await tracked(id, new Date('2026-08-04T09:00:00.000Z'), 5 * HOUR_MS);

    const billing = await trackerBillingService.billing(FROM, TO);

    expect(billing.totalHours).toBe(1);
  });

  it('reports an empty range without touching the employee tables', async () => {
    await expect(trackerBillingService.billing(FROM, TO)).resolves.toMatchObject({
      rows: [],
      totalHours: 0,
      totalAmount: 0,
    });
  });
});
