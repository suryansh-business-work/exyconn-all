import { approvalsTypeDefs } from './approvals.typeDefs';
import { decideApproval, myApprovals, myPendingApprovalCount } from './approvals.service';
import { delegateApprovals, endDelegation, myDelegations } from './delegates.service';
import { assertAuthenticated } from '../../middleware/roleGuard';
import type { ApprovalDecision } from './approvals.types';
import type { GraphQLContext } from '../../middleware/auth';

export const approvalsResolvers = {
  Query: {
    myApprovals: (_p: unknown, { kind }: { kind?: string | null }, ctx: GraphQLContext) =>
      myApprovals(ctx, kind),
    myPendingApprovalCount: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      myPendingApprovalCount(ctx),
    myApprovalDelegations: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return myDelegations(user.id);
    },
  },
  Mutation: {
    decideApproval: (
      _p: unknown,
      args: { id: string; decision: ApprovalDecision; note?: string | null },
      ctx: GraphQLContext,
    ) => decideApproval(ctx, args.id, args.decision, args.note),
    /** Always the caller's own approvals: nobody can hand somebody else's away. */
    delegateApprovals: (
      _p: unknown,
      { input }: { input: { toEmployeeId: string; fromDate: Date; toDate: Date; note?: string } },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return delegateApprovals({ ...input, fromEmployeeId: user.id });
    },
    endApprovalDelegation: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      return endDelegation(id, user.id);
    },
  },
};

export { approvalsTypeDefs };
export { APPROVAL_SOURCES } from './approvals.registry';
export { delegatedFromIds, reportsInScope } from './delegates.service';
export { ApprovalDelegateModel } from './delegate.model';
