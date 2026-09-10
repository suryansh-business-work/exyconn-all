import { approvalsTypeDefs } from './approvals.typeDefs';
import { decideApproval, myApprovals, myPendingApprovalCount } from './approvals.service';
import type { ApprovalDecision } from './approvals.types';
import type { GraphQLContext } from '../../middleware/auth';

export const approvalsResolvers = {
  Query: {
    myApprovals: (_p: unknown, { kind }: { kind?: string | null }, ctx: GraphQLContext) =>
      myApprovals(ctx, kind),
    myPendingApprovalCount: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      myPendingApprovalCount(ctx),
  },
  Mutation: {
    decideApproval: (
      _p: unknown,
      args: { id: string; decision: ApprovalDecision; note?: string | null },
      ctx: GraphQLContext,
    ) => decideApproval(ctx, args.id, args.decision, args.note),
  },
};

export { approvalsTypeDefs };
export { APPROVAL_SOURCES } from './approvals.registry';
