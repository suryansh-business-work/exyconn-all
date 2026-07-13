import { SalaryStructureModel } from './salary.model';
import { SalarySlipModel } from './salarySlip.model';
import { PolicyModel } from './policy.model';
import { HolidayModel } from './holiday.model';
import { SupportTicketModel } from './support.model';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

interface SupportTicketInput {
  subject: string;
  category: string;
  description: string;
  priority: string;
}

/** Attaches the derived gross/net figures to a salary structure document. */
function withTotals<
  T extends { basic: number; hra: number; allowances: number; deductions: number },
>(doc: T): T & { gross: number; net: number } {
  const gross = doc.basic + doc.hra + doc.allowances;
  return { ...doc, gross, net: gross - doc.deductions };
}

/** Employee self-service resolvers — all keyed off the authenticated user. */
export const employeeResolvers = {
  Query: {
    myPayroll: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const doc = await SalaryStructureModel.findOne({ employeeId: user.id }).lean();
      return doc ? withId(withTotals(doc)) : null;
    },
    mySalarySlips: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const docs = await SalarySlipModel.find({ employeeId: user.id })
        .sort({ year: -1, month: -1 })
        .lean();
      return withIds(docs);
    },
    mySupportTickets: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const docs = await SupportTicketModel.find({ employeeId: user.id })
        .sort({ createdAt: -1 })
        .lean();
      return withIds(docs);
    },
    listPolicies: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return withIds(await PolicyModel.find().sort({ effectiveDate: -1 }).lean());
    },
    listHolidays: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return withIds(await HolidayModel.find().sort({ date: 1 }).lean());
    },
  },
  Mutation: {
    createSupportTicket: async (
      _p: unknown,
      { input }: { input: SupportTicketInput },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      const doc = await SupportTicketModel.create({
        ...input,
        employeeId: user.id,
        status: 'OPEN',
      });
      return withId(doc.toObject());
    },
  },
};
