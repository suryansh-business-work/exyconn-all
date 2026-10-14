import { charge, escalation, plainMeta, type Charge } from './charges';
import type { RolePlan } from './headcount';
import { toMinor } from './money';
import type { Assumptions, Role } from './schema';

/** One employee's monthly cost in rupees, split the way a payroll report shows it. */
export interface MonthlyEmployeeCost {
  gross: number;
  statutory: number;
  gratuity: number;
  benefits: number;
  shiftAllowance: number;
}

/**
 * The cost of one employee of `role` in `month`.
 *
 * - Salary grows by the role's increment (else the scenario's salary inflation) on every
 *   anniversary of the forecast start.
 * - `gross`: statutory employer contributions are added on top — provident fund on the basic
 *   share (capped at the wage ceiling when the role says so), other statutory costs on gross,
 *   and a gratuity provision on basic.
 * - `all-inclusive`: the salary already is the employer's full cost, so no statutory
 *   contribution or gratuity is added again. Benefits and shift allowance are separate inputs
 *   and still apply.
 */
export function employeeCost(
  role: Role,
  month: number,
  assumptions: Assumptions,
): MonthlyEmployeeCost {
  const increment = role.incrementPct ?? assumptions.salaryInflationPct;
  const gross = (role.annualGross * escalation(increment, month)) / 12;
  const extras = { benefits: role.benefitsAnnual / 12, shiftAllowance: role.shiftAllowanceMonthly };
  if (role.costBasis === 'all-inclusive') {
    return { gross, statutory: 0, gratuity: 0, ...extras };
  }
  const basic = (gross * role.basicSharePct) / 100;
  const pfWages = role.pfWageCapped ? Math.min(basic, assumptions.pfWageCeilingMonthly) : basic;
  const statutory = (pfWages * role.employerPfPct) / 100 + (gross * role.otherStatutoryPct) / 100;
  return { gross, statutory, gratuity: (basic * role.gratuityPct) / 100, ...extras };
}

export function fullyLoaded(cost: MonthlyEmployeeCost): number {
  return cost.gross + cost.statutory + cost.gratuity + cost.benefits + cost.shiftAllowance;
}

const PAYROLL_PARTS = [
  ['gross', 'Salaries'],
  ['statutory', 'Employer statutory contributions'],
  ['gratuity', 'Gratuity provision'],
  ['benefits', 'Benefits'],
  ['shiftAllowance', 'Shift allowances'],
] as const;

function roleMonthCharges(plan: RolePlan, index: number, assumptions: Assumptions): Charge[] {
  const { role } = plan;
  const month = index + 1;
  const cost = employeeCost(role, month, assumptions);
  const people = plan.active[index];
  const payroll = PAYROLL_PARTS.flatMap(([part, label]) =>
    charge(
      plainMeta(role.id, 'payroll', role.department, label),
      month,
      'operating',
      toMinor(cost[part] * people),
    ),
  );
  const hires = plan.hires[index] + plan.backfills[index];
  const fee = toMinor(((cost.gross * 12 * role.recruitmentFeePct) / 100) * hires);
  return [
    ...payroll,
    ...charge(
      plainMeta(role.id, 'recruitment', role.department, 'Recruitment fees'),
      month,
      'operating',
      fee,
    ),
  ];
}

/** Payroll and recruitment-fee charges for every role, every month of the projection. */
export function payrollCharges(plans: readonly RolePlan[], assumptions: Assumptions): Charge[] {
  return plans.flatMap((plan) =>
    plan.active.flatMap((_, index) => roleMonthCharges(plan, index, assumptions)),
  );
}
