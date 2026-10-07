import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import {
  employeeRates,
  hoursOf,
  priceTime,
  round,
} from '../../../../src/modules/tracker/tracker.billing.pricing';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'GBP' });

const HOUR_MS = 3_600_000;

describe('the billing arithmetic', () => {
  it('rounds money to two places once', () => {
    expect(round(1.236)).toBe(1.24);
    expect(round(2.344)).toBe(2.34);
    expect(round(0)).toBe(0);
  });

  it('turns tracked milliseconds into hours to two places', () => {
    expect(hoursOf(90 * 60_000)).toBe(1.5);
    expect(hoursOf(20 * 60_000)).toBe(0.33);
  });

  it('prices time from the rounded hours, and marks unrated work as unrated', () => {
    expect(priceTime(20 * 60_000, 150)).toEqual({ hours: 0.33, amount: 49.5, rated: true });
    expect(priceTime(2 * HOUR_MS, 0)).toEqual({ hours: 2, amount: 0, rated: false });
  });
});

describe('employee rates', () => {
  it('answers an empty map for no employees, without a query', async () => {
    const lookup = jest.spyOn(UserModel, 'find');

    await expect(employeeRates([])).resolves.toEqual(new Map());
    expect(lookup).not.toHaveBeenCalled();
    lookup.mockRestore();
  });

  it('reads the rate and currency off the HR salary structure', async () => {
    const user = await UserModel.create({
      name: 'Asha',
      email: `${randomUUID()}@exyconn.com`,
      passwordHash: randomUUID(),
    });
    const id = String(user._id);
    await SalaryStructureModel.create({
      employeeId: id,
      currency: 'INR',
      payType: 'HOURLY',
      rate: 700,
      billingRate: 1_200,
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    });

    const rates = await employeeRates([id]);

    expect(rates.get(id)).toEqual({
      id,
      name: 'Asha',
      email: user.email,
      payType: 'HOURLY',
      currency: 'INR',
      billingRate: 1_200,
    });
  });

  it('keeps hours of a deleted employee with no structure, in the company currency', async () => {
    const gone = new Types.ObjectId().toString();

    const rates = await employeeRates([gone]);

    expect(rates.get(gone)).toEqual({
      id: gone,
      name: 'Deleted employee',
      email: '',
      payType: 'FIXED',
      currency: 'GBP',
      billingRate: 0,
    });
  });
});
