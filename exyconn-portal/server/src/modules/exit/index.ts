import { ExitRecordModel } from './exit.model';
import { exitTypeDefs } from './exit.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { isValidObjectId } from 'mongoose';
import { UserModel } from '../admin/user.model';
import { AssetModel } from '../assets/asset.model';
import type { GraphQLContext } from '../../middleware/auth';

const EXITED = 'EXITED';

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

/**
 * Reaching EXITED is the moment the person stops being an employee, so their
 * portal access goes with it. Wrapped around the generated update rather than a
 * model hook, so the same edit HR already makes is what revokes access.
 */
const updateExitRecord = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: ExitRecordInput };
  const before = await ExitRecordModel.findById(id).select('stage').lean();
  const updated = await crud.Mutation.updateExitRecord(p, args, ctx);
  const becameExited = before?.stage !== EXITED && input.stage === EXITED;
  if (becameExited && isValidObjectId(input.employeeId)) {
    await UserModel.updateOne(
      { _id: input.employeeId },
      { isActive: false, employmentStatus: 'TERMINATED' },
    );
  }
  return updated;
};

export const exitResolvers = {
  Query: { ...crud.Query, myExitRecord },
  Mutation: { ...crud.Mutation, updateExitRecord },
  ExitRecord: {
    /** What the leaver still holds, straight from the asset register. */
    heldAssets: async (record: { employeeId: string }) => {
      const rows = await AssetModel.find({ assignedToId: record.employeeId, status: 'ASSIGNED' })
        .select('assetTag name status')
        .sort({ assetTag: 1 })
        .lean();
      return withIds(rows);
    },
    /** Derived so it is always right, rather than a column that goes stale daily. */
    daysToLastWorkingDay: (record: { lastWorkingDate?: Date | string | null }) => {
      if (!record.lastWorkingDate) return null;
      const days = calendarDaysUntil(new Date(record.lastWorkingDate));
      return days >= 0 ? days : null;
    },
  },
};
export { exitTypeDefs };
