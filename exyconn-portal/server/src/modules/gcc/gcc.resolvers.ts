import type { GraphQLContext } from '../../middleware/auth';
import { emailGccEstimate, type CaptchaInput, type GccEmailInput } from './gcc.email';
import { createGccShare, revokeGccShare, sharedGccEstimate, type GccShareInput } from './gcc.share';

const ipOf = (ctx: GraphQLContext) => ctx.ip ?? 'unknown';

export const gccResolvers = {
  Query: {
    sharedGccEstimate: (_p: unknown, { token }: { token: string }, ctx: GraphQLContext) =>
      sharedGccEstimate(token, ipOf(ctx)),
  },
  Mutation: {
    emailGccEstimate: async (
      _p: unknown,
      { input, captcha }: { input: GccEmailInput; captcha: CaptchaInput },
      ctx: GraphQLContext,
    ) => ({ sentTo: await emailGccEstimate(input, captcha, ipOf(ctx)) }),
    createGccShare: (
      _p: unknown,
      { input, captcha }: { input: GccShareInput; captcha: CaptchaInput },
      ctx: GraphQLContext,
    ) => createGccShare(input, captcha, ipOf(ctx)),
    revokeGccShare: (
      _p: unknown,
      { token, revokeKey }: { token: string; revokeKey: string },
      ctx: GraphQLContext,
    ) => revokeGccShare(token, revokeKey, ipOf(ctx)),
  },
};
