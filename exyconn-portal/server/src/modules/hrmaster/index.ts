import { HolidayModel } from '../employee/holiday.model';
import { LeavePolicyModel } from './leavePolicy.model';
import { LeaveBalanceModel } from './leaveBalance.model';
import { hrMasterTypeDefs } from './hrmaster.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { withIds } from '../../utils/serialize';
import {
  employeeCountry,
  employeePlace,
  ensureLeaveBalances,
  holidaysObservedIn,
  offeredPolicies,
} from './leave-country';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

interface HolidayInput {
  name: string;
  date: Date;
  type: string;
  description?: string | null;
  country: string;
  excludedCountries: string[];
  cities: string[];
}
interface LeavePolicyInput {
  name: string;
  code: string;
  annualQuota: number;
  paid: boolean;
  halfDayAllowed: boolean;
  carryForwardCap: number;
  active: boolean;
  overrides: { country: string; annualQuota: number; carryForwardCap: number; active: boolean }[];
}
interface LeaveBalanceInput {
  employeeId: string;
  leaveTypeCode: string;
  year: number;
  allocated: number;
  carriedForward: number;
  used: number;
  adjustment: number;
}

// Holiday is read by every employee through the employee module; this is the
// HR-side administration of the same records.
const holidayCrud = createCrudResolvers(
  createCrudService<HolidayInput>(HolidayModel as never, 'Holiday'),
  {
    name: 'Holiday',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name', 'description'],
      filterFields: ['name', 'type', 'country'],
      sortFields: ['name', 'date', 'type', 'country', 'createdAt'],
      defaultSort: { field: 'date', dir: 'ASC' },
    },
    stats: { countBy: ['type'] },
  },
);
// listHolidays already exists (employee module) and must stay readable by everyone.
delete holidayCrud.Query.listHolidays;

const leavePolicyCrud = createCrudResolvers(
  createCrudService<LeavePolicyInput>(LeavePolicyModel as never, 'LeavePolicy'),
  {
    name: 'LeavePolicy',
    plural: 'LeavePolicies',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name', 'code'],
      filterFields: ['code', 'active'],
      sortFields: ['name', 'code', 'annualQuota', 'createdAt'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['active'], sum: ['annualQuota'] },
  },
);

const leaveBalanceCrud = createCrudResolvers(
  createCrudService<LeaveBalanceInput>(LeaveBalanceModel as never, 'LeaveBalance'),
  {
    name: 'LeaveBalance',
    roles: [ROLES.HR],
    table: {
      searchFields: ['leaveTypeCode'],
      filterFields: ['employeeId', 'leaveTypeCode', 'year'],
      sortFields: ['leaveTypeCode', 'year', 'allocated', 'used', 'createdAt'],
      defaultSort: { field: 'year', dir: 'DESC' },
    },
    stats: { countBy: ['leaveTypeCode'], sum: ['allocated', 'used'] },
  },
);

/** What an employee can actually pick when applying for leave, on their country's terms. */
async function activeLeavePolicies(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  return withIds(await offeredPolicies(await employeeCountry(user.id)));
}

const ownLeaveBalances = createMyRecordsResolver(LeaveBalanceModel as never, { year: -1 });

/** The employee's balances, after filling in any leave type HR has added this year. */
async function myLeaveBalances(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  await ensureLeaveBalances(user.id, new Date().getUTCFullYear());
  return ownLeaveBalances(_p, _a, ctx);
}

/**
 * One employee's balances for `year`, for HR on the employee's own page. Every metered type
 * their country offers is filled in first, so HR sees — and can adjust — each one without
 * having to create it by hand.
 */
async function employeeLeaveBalances(
  _p: unknown,
  { employeeId, year }: { employeeId: string; year: number },
  ctx: GraphQLContext,
) {
  assertRole(ctx, [ROLES.HR]);
  await ensureLeaveBalances(employeeId, year);
  const rows = await LeaveBalanceModel.find({ employeeId, year }).sort({ leaveTypeCode: 1 }).lean();
  return withIds(rows);
}

/** The holidays the signed-in employee observes in their country and city. */
async function myHolidays(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const { country, city } = await employeePlace(user.id);
  const rows = await HolidayModel.find(holidaysObservedIn(country, city)).sort({ date: 1 }).lean();
  return withIds(rows);
}

export const hrMasterResolvers = {
  Query: {
    ...holidayCrud.Query,
    ...leavePolicyCrud.Query,
    ...leaveBalanceCrud.Query,
    activeLeavePolicies,
    myLeaveBalances,
    employeeLeaveBalances,
    myHolidays,
  },
  Mutation: {
    ...holidayCrud.Mutation,
    ...leavePolicyCrud.Mutation,
    ...leaveBalanceCrud.Mutation,
  },
  // Records written before countries existed have neither field; they are global.
  Holiday: {
    country: (holiday: { country?: string | null }) => holiday.country ?? '',
    excludedCountries: (holiday: { excludedCountries?: string[] | null }) =>
      holiday.excludedCountries ?? [],
    cities: (holiday: { cities?: string[] | null }) => holiday.cities ?? [],
  },
  LeavePolicy: {
    overrides: (policy: { overrides?: unknown[] | null }) => policy.overrides ?? [],
  },
  /** Derived rather than stored, so it can never disagree with its parts. */
  LeaveBalance: {
    available: (balance: {
      allocated: number;
      carriedForward: number;
      adjustment: number;
      used: number;
    }) => balance.allocated + balance.carriedForward + balance.adjustment - balance.used,
  },
};
export { hrMasterTypeDefs };
