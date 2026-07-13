import { hrService, type ApplyLeaveInput, type MarkAttendanceInput } from './hr.service';
import { assertRole, assertAuthenticated } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

const hrOnly = [ROLES.HR];

/** Custom HR resolvers: employee self-service, per-employee views, and dashboard. */
export const hrCustomResolvers = {
  Query: {
    myLeaveRequests: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return withIds(await hrService.myLeaves(user.id));
    },
    myAttendance: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return withIds(await hrService.myAttendance(user.id));
    },
    listAttendance: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, hrOnly);
      return withIds(await hrService.listAttendance());
    },
    leaveRequestsByEmployee: async (
      _p: unknown,
      { employeeId }: { employeeId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, hrOnly);
      return withIds(await hrService.leavesByEmployee(employeeId));
    },
    attendanceByEmployee: async (
      _p: unknown,
      { employeeId }: { employeeId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, hrOnly);
      return withIds(await hrService.attendanceByEmployee(employeeId));
    },
    hrDashboard: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, hrOnly);
      return hrService.dashboard();
    },
  },
  Mutation: {
    applyLeave: async (_p: unknown, { input }: { input: ApplyLeaveInput }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return withId(await hrService.applyLeave(user.id, input));
    },
    markAttendance: async (
      _p: unknown,
      { input }: { input: MarkAttendanceInput },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return withId(await hrService.markAttendance(user.id, input));
    },
    setLeaveStatus: async (
      _p: unknown,
      { id, status }: { id: string; status: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, hrOnly);
      return withId(await hrService.setLeaveStatus(id, status));
    },
  },
};
