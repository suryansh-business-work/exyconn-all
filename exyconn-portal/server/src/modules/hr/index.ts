import { LeaveRequestModel } from './hr.model';
import { DepartmentModel } from './department.model';
import { PositionModel } from './position.model';
import { hrTypeDefs } from './hr.typeDefs';
import { hrCustomResolvers } from './hr.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { refuseOwnRecordWrites } from '../../lib/permissions';
import { assertRole } from '../../middleware/roleGuard';
import type { GraphQLContext } from '../../middleware/auth';
// Imported for its side effect: the module registers the dates it wants chased.
import './hr.reminders';
import {
  assertDepartmentEmpty,
  assertSalaryBand,
  departmentNameOf,
  filledCount,
  followDepartmentRename,
  headNameOf,
  positionsOf,
} from './department.service';

interface LeaveRequestInput {
  employeeId: string;
  type: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: string;
}

interface DepartmentInput {
  name: string;
  code?: string;
  description?: string;
  headId?: string;
}

interface PositionInput {
  name: string;
  department: string;
  code?: string;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  grade?: string;
  employmentType?: string;
  headcount?: number;
  active?: boolean;
}

type IdArgs = { id: string };
type InputArgs<T> = { input: T };

const hrRoles = { roles: [ROLES.HR] };

const leaveCrudResolvers = createCrudResolvers(
  createCrudService<LeaveRequestInput>(LeaveRequestModel as never, 'LeaveRequest'),
  { name: 'LeaveRequest', ...hrRoles },
);
const departmentResolvers = createCrudResolvers(
  createCrudService<DepartmentInput>(DepartmentModel as never, 'Department'),
  { name: 'Department', ...hrRoles },
);
const positionResolvers = createCrudResolvers(
  createCrudService<PositionInput>(PositionModel as never, 'Position'),
  { name: 'Position', ...hrRoles },
);

/** Department writes that keep its positions and employees attached to it. */
const departmentMutations = {
  ...departmentResolvers.Mutation,
  updateDepartment: async (
    p: unknown,
    args: IdArgs & InputArgs<DepartmentInput>,
    ctx: GraphQLContext,
  ) => {
    assertRole(ctx, hrRoles.roles);
    const previous = await departmentNameOf(args.id);
    const updated = await departmentResolvers.Mutation.updateDepartment(p, args as never, ctx);
    await followDepartmentRename(previous, args.input.name.trim());
    return updated;
  },
  deleteDepartment: async (p: unknown, args: IdArgs, ctx: GraphQLContext) => {
    assertRole(ctx, hrRoles.roles);
    await assertDepartmentEmpty(args.id);
    return departmentResolvers.Mutation.deleteDepartment(p, args as never, ctx);
  },
};

/** Position writes refuse a salary band that is upside down. */
const positionMutations = {
  ...positionResolvers.Mutation,
  createPosition: async (p: unknown, args: InputArgs<PositionInput>, ctx: GraphQLContext) => {
    assertSalaryBand(args.input);
    return positionResolvers.Mutation.createPosition(p, args as never, ctx);
  },
  updatePosition: async (
    p: unknown,
    args: IdArgs & InputArgs<PositionInput>,
    ctx: GraphQLContext,
  ) => {
    assertSalaryBand(args.input);
    return positionResolvers.Mutation.updatePosition(p, args as never, ctx);
  },
};

/** Leave CRUD + departments/positions + self-service, per-employee views & dashboard. */
export const hrResolvers = {
  Department: {
    positions: (parent: { name: string }) => positionsOf(parent.name),
    headName: (parent: { headId?: string | null }) => headNameOf(parent.headId),
  },
  Position: {
    filled: (parent: { name: string; department: string }) => filledCount(parent),
  },
  Query: {
    ...leaveCrudResolvers.Query,
    ...departmentResolvers.Query,
    ...positionResolvers.Query,
    ...hrCustomResolvers.Query,
  },
  Mutation: {
    // HR edits anybody's leave here — except their own, which would be approving it themselves.
    ...refuseOwnRecordWrites(leaveCrudResolvers.Mutation, 'LeaveRequest', async (id) => {
      const row = await LeaveRequestModel.findById(id).select('employeeId').lean();
      return row?.employeeId;
    }),
    ...departmentMutations,
    ...positionMutations,
    ...hrCustomResolvers.Mutation,
  },
};
export { hrTypeDefs };
