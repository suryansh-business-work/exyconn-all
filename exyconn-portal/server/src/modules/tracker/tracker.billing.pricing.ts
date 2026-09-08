import { UserModel } from '../admin/user.model';
import { SalaryStructureModel } from '../employee/salary.model';
import { DEFAULT_CURRENCY, DEFAULT_PAY_TYPE } from '../../constants/pay';

const MS_PER_HOUR = 3_600_000;

/** Money is rounded to two places once, at the end — never accumulated pre-rounded. */
export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Hours, to two places, from the milliseconds every tracker total is kept in. */
export function hoursOf(activeMs: number): number {
  return round(activeMs / MS_PER_HOUR);
}

/** What a stretch of billable time is worth at an hourly rate. */
export interface PricedTime {
  hours: number;
  amount: number;
  /** False when no rate is set — the amount is zero because nobody priced the work. */
  rated: boolean;
}

/**
 * Prices billable milliseconds at a rate. Pure, and the ONE place the arithmetic lives, so
 * the per-employee report and the per-project report can never disagree about a figure.
 */
export function priceTime(activeMs: number, billingRate: number): PricedTime {
  const hours = hoursOf(activeMs);
  return { hours, amount: round(hours * billingRate), rated: billingRate > 0 };
}

/** What billing needs to know about an employee: who they are and what an hour bills at. */
export interface EmployeeRate {
  id: string;
  name: string;
  email: string;
  payType: string;
  currency: string;
  billingRate: number;
}

/**
 * Names and rates for a set of employees, in two queries.
 *
 * The rate is NOT the tracker's to hold: it comes from the salary structure in HR, the same
 * record payroll reads. An account deleted since the time was tracked still has hours on
 * the books, so it is returned as "Deleted employee" rather than dropped.
 */
export async function employeeRates(userIds: string[]): Promise<Map<string, EmployeeRate>> {
  if (userIds.length === 0) {
    return new Map();
  }
  const [users, structures] = await Promise.all([
    UserModel.find({ _id: { $in: userIds } })
      .select('name email')
      .lean(),
    SalaryStructureModel.find({ employeeId: { $in: userIds } }).lean(),
  ]);
  const byUser = new Map(users.map((user) => [String(user._id), user]));
  const byEmployee = new Map(structures.map((structure) => [structure.employeeId, structure]));

  return new Map(
    userIds.map((id) => {
      const user = byUser.get(id);
      const structure = byEmployee.get(id);
      return [
        id,
        {
          id,
          name: user?.name ?? 'Deleted employee',
          email: user?.email ?? '',
          payType: structure?.payType ?? DEFAULT_PAY_TYPE,
          currency: structure?.currency ?? DEFAULT_CURRENCY,
          billingRate: structure?.billingRate ?? 0,
        },
      ];
    }),
  );
}
