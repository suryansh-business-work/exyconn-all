import { riskResolvers } from './risk.resolvers';
import { objectiveResolvers } from './objective.resolvers';
import { auditResolvers } from './audit.resolvers';
import { findingResolvers } from './finding.resolvers';
import { reviewResolvers } from './review.resolvers';
import { complianceTypeDefs } from './compliance.typeDefs';
import { complianceAuditsTypeDefs } from './compliance.audits.typeDefs';
import { complianceReviewsTypeDefs } from './compliance.reviews.typeDefs';
import type { GraphQLContext } from '../../middleware/auth';

type ResolverMap = Record<string, (p: unknown, a: never, c: GraphQLContext) => unknown>;

const groups = [
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
  Mutation: groups.reduce<ResolverMap>((all, group) => ({ ...all, ...group.Mutation }), {}),
  Risk: riskResolvers.Risk,
  Objective: objectiveResolvers.Objective,
  InternalAudit: auditResolvers.InternalAudit,
  ManagementReview: reviewResolvers.ManagementReview,
};

export { complianceTypeDefs, complianceAuditsTypeDefs, complianceReviewsTypeDefs };
export { RiskModel } from './risk.model';
export { ObjectiveModel } from './objective.model';
export { InternalAuditModel } from './audit.model';
export { FindingModel } from './finding.model';
export { ManagementReviewModel } from './review.model';
