import { ExitRecordModel } from './exit.model';
import { exitTypeDefs } from './exit.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days from today to `target`, comparing dates rather than instants. */
function calendarDaysUntil(target: Date): number {
  const atMidnight = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((atMidnight(target) - atMidnight(new Date())) / MS_PER_DAY);
}

interface ExitRecordInput {
  employeeId: string;
  resignationDate: Date;
  lastWorkingDate?: Date | null;
  noticePeriodDays: number;
  reason: string;
  stage: string;
  assetsReturned: boolean;
  knowledgeTransferDone: boolean;
  exitInterviewNotes: string;
  finalSettlementAmount?: number | null;
  documentsIssued: boolean;
}

const crud = createCrudResolvers(
  createCrudService<ExitRecordInput>(ExitRecordModel as never, 'ExitRecord'),
  {
    name: 'ExitRecord',
    roles: [ROLES.HR],
    table: {
      searchFields: ['reason', 'exitInterviewNotes'],
      filterFields: ['employeeId', 'stage'],
      sortFields: ['resignationDate', 'lastWorkingDate', 'stage', 'createdAt'],
      defaultSort: { field: 'resignationDate', dir: 'DESC' },
    },
    stats: { countBy: ['stage'] },
  },
);

/** The employee's own record, so they can follow their own offboarding. */
async function myExitRecord(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const row = await ExitRecordModel.findOne({ employeeId: user.id })
    .sort({ resignationDate: -1 })
    .lean();
  return row ? withId(row as { _id: unknown }) : null;
}

export const exitResolvers = {
  Query: { ...crud.Query, myExitRecord },
  Mutation: crud.Mutation,
  ExitRecord: {
    /** Derived so it is always right, rather than a column that goes stale daily. */
    daysToLastWorkingDay: (record: { lastWorkingDate?: Date | string | null }) => {
      if (!record.lastWorkingDate) return null;
      const days = calendarDaysUntil(new Date(record.lastWorkingDate));
      return days >= 0 ? days : null;
    },
  },
};
export { exitTypeDefs };
