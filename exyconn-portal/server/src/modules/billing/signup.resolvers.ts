import type { GraphQLContext } from '../../middleware/auth';
import { runForOrganization } from '../../lib/tenant';
import { withIds } from '../../utils/serialize';
import { recordAudit } from '../audit/audit.service';
import { auditedSignIn, signInFrom } from '../auth/auth.resolvers';
import { planService } from './plan.service';
import { completeSignup, requestSignupCode, type SignupInput } from './signup.service';

/** Public self sign-up: no session is needed, and none is accepted in place of the code. */
export const signupResolvers = {
  Query: {
    signupPlans: async () => withIds(await planService.listPublic()),
  },
  Mutation: {
    requestSignupCode: (_p: unknown, { email }: { email: string }, ctx: GraphQLContext) =>
      requestSignupCode(email, ctx.ip ?? 'unknown'),
    completeSignup: async (_p: unknown, { input }: { input: SignupInput }, ctx: GraphQLContext) => {
      const { organization, plan, result } = await completeSignup(input, signInFrom(ctx));
      const organizationId = String(organization._id);
      // Both lines land in the new company's own log, where its administrator will read them.
      return runForOrganization(organizationId, async () => {
        await recordAudit(ctx, {
          action: 'CREATE',
          module: 'Billing',
          entityId: organizationId,
          entityLabel: organization.name,
          summary: `Signed up ${organization.name} on a trial of ${plan.name}`,
          actor: { id: 'self-signup', name: input.name, email: input.email },
        });
        return auditedSignIn(result, ctx, 'Signed in after creating the company');
      });
    },
  },
};
