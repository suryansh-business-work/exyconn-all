import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertRole } from '../../middleware/roleGuard';
import { withIds } from '../../utils/serialize';
import { assertMayActFor } from '../admin/reporting';
import { assertEmployee, assertTrackerDevice } from './tracker.auth';
import { trackerDeviceService } from './tracker.device.service';
import { trackerEarningsService } from './tracker.earnings.service';
import { trackerLocationService, type LocationInput } from './tracker.location.service';

/**
 * Where an employee was while working, and what their tracked time pays. The `my*` reads and
 * the pin write are scoped to the caller's own id; reading somebody else's is HR's, an
 * administrator's or (for locations) their manager's.
 */
export const trackerLocationResolvers = {
  Query: {
    myTrackerLocations: async (_p: unknown, { date }: { date: string }, ctx: GraphQLContext) => {
      const user = await assertEmployee(ctx);
      return withIds(await trackerLocationService.pinsOn(user.id, date));
    },
    employeeLocations: async (
      _p: unknown,
      { employeeId, date }: { employeeId: string; date: string },
      ctx: GraphQLContext,
    ) => {
      await assertMayActFor(ctx, employeeId, [ROLES.HR]);
      return withIds(await trackerLocationService.pinsOn(employeeId, date));
    },
    myTrackerEarnings: async (
      _p: unknown,
      { from, to }: { from: string; to: string },
      ctx: GraphQLContext,
    ) => {
      const user = await assertEmployee(ctx);
      return trackerEarningsService.earnings(user.id, from, to);
    },
    employeeEarnings: async (
      _p: unknown,
      { employeeId, from, to }: { employeeId: string; from: string; to: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, [ROLES.HR]);
      return trackerEarningsService.earnings(employeeId, from, to);
    },
  },
  Mutation: {
    trackerRecordLocation: async (
      _p: unknown,
      { location }: { location: LocationInput },
      ctx: GraphQLContext,
    ) => {
      const { userId, deviceId } = await assertTrackerDevice(ctx);
      const timezone = await trackerDeviceService.timezoneOf(userId, deviceId);
      return trackerLocationService.recordMove(userId, timezone, location);
    },
  },
};
