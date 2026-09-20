import { riskResolvers } from './risk.resolvers';
import { objectiveResolvers } from './objective.resolvers';
import { auditResolvers } from './audit.resolvers';
import { findingResolvers } from './finding.resolvers';
import { reviewResolvers } from './review.resolvers';
import { complianceDashboardResolvers } from './compliance.dashboard';
import { complianceDashboardTypeDefs } from './compliance.dashboard.typeDefs';
import { complianceTypeDefs } from './compliance.typeDefs';
import { complianceAuditsTypeDefs } from './compliance.audits.typeDefs';
import { complianceReviewsTypeDefs } from './compliance.reviews.typeDefs';
// Imported for its side effect: the module registers what it wants chased.
import './compliance.reminders';
import type { GraphQLContext } from '../../middleware/auth';

type ResolverMap = Record<string, (p: unknown, a: never, c: GraphQLContext) => unknown>;

/** A register's resolvers. The dashboard is read-only, so `Mutation` is optional. */
interface ResolverGroup {
  Query: ResolverMap;
  Mutation?: ResolverMap;
}

const groups: ResolverGroup[] = [
  complianceDashboardResolvers,
  riskResolvers,
  objectiveResolvers,
  auditResolvers,
  findingResolvers,
  reviewResolvers,
];

/**
 * One management system, five registers: risks, objectives, audits, findings and the reviews
 * at which leadership looks at all four. Each is a plain CRUD module; what makes them a
 * management system is that they cite each other and share a vocabulary
 * (`compliance.constants.ts`).
 */
export const complianceResolvers = {
  Query: groups.reduce<ResolverMap>((all, group) => ({ ...all, ...group.Query }), {}),
  Mutation: groups.reduce<ResolverMap>((all, group) => ({ ...all, ...(group.Mutation ?? {}) }), {}),
  Finding: findingResolvers.Finding,
  Risk: riskResolvers.Risk,
  Objective: objectiveResolvers.Objective,
  InternalAudit: auditResolvers.InternalAudit,
  ManagementReview: reviewResolvers.ManagementReview,
};

export {
  complianceTypeDefs,
  complianceAuditsTypeDefs,
  complianceReviewsTypeDefs,
  complianceDashboardTypeDefs,
};
export { RiskModel } from './risk.model';
export { ObjectiveModel } from './objective.model';
export { InternalAuditModel } from './audit.model';
export { FindingModel } from './finding.model';
export { ManagementReviewModel } from './review.model';
