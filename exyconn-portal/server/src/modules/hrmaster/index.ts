import { HolidayModel } from '../employee/holiday.model';
import { LeavePolicyModel } from './leavePolicy.model';
import { LeaveBalanceModel } from './leaveBalance.model';
import { hrMasterTypeDefs } from './hrmaster.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

interface HolidayInput {
  name: string;
  date: Date;
  type: string;
  description?: string | null;
}
interface LeavePolicyInput {
  name: string;
  code: string;
  annualQuota: number;
  paid: boolean;
  halfDayAllowed: boolean;
  carryForwardCap: number;
  active: boolean;
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
      filterFields: ['name', 'type'],
      sortFields: ['name', 'date', 'type', 'createdAt'],
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

/** What an employee can actually pick when applying for leave. */
async function activeLeavePolicies(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  assertAuthenticated(ctx);
  const rows = await LeavePolicyModel.find({ active: true }).sort({ name: 1 }).lean();
  return withIds(rows as { _id: unknown }[]);
}

export const hrMasterResolvers = {
  Query: {
    ...holidayCrud.Query,
    ...leavePolicyCrud.Query,
    ...leaveBalanceCrud.Query,
    activeLeavePolicies,
    myLeaveBalances: createMyRecordsResolver(LeaveBalanceModel as never, { year: -1 }),
  },
  Mutation: {
    ...holidayCrud.Mutation,
    ...leavePolicyCrud.Mutation,
    ...leaveBalanceCrud.Mutation,
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
