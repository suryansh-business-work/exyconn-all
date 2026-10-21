import { assertPermission } from '../../lib/permissions';
import { assertAuthenticated } from '../../middleware/roleGuard';
import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { hoursReportPdfFile } from './tracker.report.file';

/** The same permission the XLSX report and the calendar answer to. */
const TRACKER_MODULE = 'Tracker';
const TRACKER_ROLES = [ROLES.TRACKER];

interface RangeArgs {
  from: Date;
  to: Date;
  timezone: string;
}

/** The hours report as a PDF: any employee's for Tracker staff, and anybody's own. */
export const trackerReportResolvers = {
  Query: {
    trackerHoursReportPdf: async (
      _p: unknown,
      { userId, from, to, timezone }: RangeArgs & { userId: string },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, TRACKER_MODULE, TRACKER_ROLES, 'VIEW');
      return hoursReportPdfFile(userId, from, to, timezone);
    },
    myTrackerHoursReportPdf: async (
      _p: unknown,
      { from, to, timezone }: RangeArgs,
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return hoursReportPdfFile(user.id, from, to, timezone);
    },
  },
};
