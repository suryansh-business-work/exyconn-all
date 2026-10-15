import { monthRange } from './charges';
import { LIMITS } from './limits';
import type { Assumptions, Role } from './schema';

/**
 * Headcount is modelled as expected values: a role of 10 ramped over 4 months adds 2.5 people a
 * month, and 12% annual attrition replaces 1% of the team every month. Fractions keep costs
 * smooth and exact; reports round headcount for display only.
 */
export interface RolePlan {
  role: Role;
  /** Index = month - 1. People on payroll during the month. */
  active: number[];
  /** New positions filled in the month. */
  hires: number[];
  /** Leavers replaced in the month (attrition backfill). */
  backfills: number[];
}

export interface HeadcountPlan {
  roles: RolePlan[];
  active: number[];
  /** New hires plus backfills: every hire that costs a recruitment fee. */
  hires: number[];
  newHires: number[];
}

const MONTHS = monthRange(1, LIMITS.months);

function activeAt(role: Role, month: number): number {
  if (month < role.hireMonth) {
    return 0;
  }
  const filledMonths = month - role.hireMonth + 1;
  return Math.min(role.headcount, (role.headcount * filledMonths) / role.rampMonths);
}

export function planRole(role: Role, assumptions: Assumptions): RolePlan {
  const attrition = (role.attritionPct ?? assumptions.attritionPct) / 100 / 12;
  const active = MONTHS.map((month) => activeAt(role, month));
  const hires = active.map((count, index) => count - (index === 0 ? 0 : active[index - 1]));
  const backfills = active.map((count) => count * attrition);
  return { role, active, hires, backfills };
}

const sumBy = (plans: readonly RolePlan[], pick: (plan: RolePlan) => number[]) =>
  MONTHS.map((_, index) => plans.reduce((total, plan) => total + pick(plan)[index], 0));

export function planHeadcount(roles: readonly Role[], assumptions: Assumptions): HeadcountPlan {
  const plans = roles.map((role) => planRole(role, assumptions));
  const newHires = sumBy(plans, (plan) => plan.hires);
  const backfills = sumBy(plans, (plan) => plan.backfills);
  return {
    roles: plans,
    active: sumBy(plans, (plan) => plan.active),
    hires: newHires.map((count, index) => count + backfills[index]),
    newHires,
  };
}
