import { RiskModel } from './risk.model';
import { FindingModel } from './finding.model';
import { InternalAuditModel } from './audit.model';
import { ObjectiveModel } from './objective.model';
import { ManagementReviewModel } from './review.model';
import { MANAGEMENT_STANDARDS, riskLevel } from './compliance.constants';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * One screen that answers "where does the management system actually stand".
 *
 * The compliance portal opened onto the risk register: five registers, no overview, and no
 * way to see that eleven corrective actions were overdue or that a standard had no audit
 * behind it at all. An auditor asks exactly those questions, and they were answerable only
 * by reading every register in turn.
 */

/** A count of things by one of their own enum values, as the charts read it. */
interface Slice {
  label: string;
  value: number;
}

const DAY_MS = 86_400_000;

/** Overdue means past its date and not finished — the same reading the sweep chases on. */
const overdueFindings = () =>
  FindingModel.countDocuments({
    status: { $nin: ['VERIFIED', 'CLOSED'] },
    dueOn: { $ne: null, $lte: new Date() },
  });

/** Risks whose review date has passed, which is how a register quietly goes stale. */
const risksPastReview = () =>
  RiskModel.countDocuments({
    status: { $ne: 'CLOSED' },
    reviewDueOn: { $ne: null, $lte: new Date() },
  });

/**
 * The residual heat map: every open risk placed by its residual score.
 *
 * Residual rather than inherent, because that is the risk the company is actually carrying
 * after its controls — the inherent score only says how bad it would be with none.
 */
async function residualHeat(): Promise<Slice[]> {
  const rows = await RiskModel.find({ status: { $ne: 'CLOSED' } })
    .select('residualLikelihood residualImpact')
    .lean();
  const counts = new Map<string, number>();
  for (const risk of rows) {
    const level = riskLevel(risk.residualLikelihood * risk.residualImpact);
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

/**
 * Which standards have an audit behind them, and which are claimed and never audited.
 *
 * A standard on a risk or an objective with no audit against it in the last year is the
 * gap a certification body finds first.
 */
async function standardCoverage(now: Date): Promise<Slice[]> {
  const aYearAgo = new Date(now.getTime() - 365 * DAY_MS);
  const audits = await InternalAuditModel.find({
    status: { $in: ['REPORTED', 'CLOSED'] },
    performedOn: { $ne: null, $gte: aYearAgo },
  })
    .select('standards')
    .lean();
  const audited = new Map<string, number>();
  for (const audit of audits) {
    for (const standard of audit.standards ?? []) {
      audited.set(standard, (audited.get(standard) ?? 0) + 1);
    }
  }
  return MANAGEMENT_STANDARDS.map((standard) => ({
    label: standard,
    value: audited.get(standard) ?? 0,
  }));
}

/** Counts grouped by a field, for the status breakdowns. */
async function countBy(
  model: { aggregate(pipeline: unknown[]): Promise<{ _id: string; value: number }[]> },
  field: string,
): Promise<Slice[]> {
  const rows = await model.aggregate([
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
  ]);
  return rows.map((row) => ({ label: row._id ?? 'UNSET', value: row.value }));
}

export const complianceDashboardResolvers = {
  Query: {
    complianceOverview: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.COMPLIANCE]);
      const now = new Date();
      const [
        risks,
        openRisks,
        risksDue,
        findings,
        openFindings,
        findingsOverdue,
        audits,
        auditsPlanned,
        objectives,
        objectivesAtRisk,
        reviews,
        lastReview,
        risksByStatus,
        findingsByType,
        heat,
        coverage,
      ] = await Promise.all([
        RiskModel.countDocuments(),
        RiskModel.countDocuments({ status: { $ne: 'CLOSED' } }),
        risksPastReview(),
        FindingModel.countDocuments(),
        FindingModel.countDocuments({ status: { $nin: ['VERIFIED', 'CLOSED'] } }),
        overdueFindings(),
        InternalAuditModel.countDocuments(),
        InternalAuditModel.countDocuments({ status: 'PLANNED' }),
        ObjectiveModel.countDocuments(),
        ObjectiveModel.countDocuments({ status: { $in: ['AT_RISK', 'MISSED'] } }),
        ManagementReviewModel.countDocuments(),
        ManagementReviewModel.findOne({ status: { $in: ['HELD', 'MINUTED'] } })
          .sort({ heldOn: -1 })
          .select('heldOn title')
          .lean(),
        countBy(RiskModel as never, 'status'),
        countBy(FindingModel as never, 'type'),
        residualHeat(),
        standardCoverage(now),
      ]);

      return {
        risks,
        openRisks,
        risksPastReview: risksDue,
        findings,
        openFindings,
        findingsOverdue,
        audits,
        auditsPlanned,
        objectives,
        objectivesAtRisk,
        reviews,
        lastReviewOn: lastReview?.heldOn ?? null,
        lastReviewTitle: lastReview?.title ?? '',
        risksByStatus,
        findingsByType,
        residualHeat: heat,
        standardCoverage: coverage,
      };
    },
  },
};
