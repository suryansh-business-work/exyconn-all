import { demoCallerOf } from '../../../lib/demoCaller';
import type { GraphQLContext } from '../../../middleware/auth';
import { sandboxInfo } from './sandbox.info';
import { issueSandboxToken, revokeSandboxToken, sandboxTokens } from './sandbox.tokens';

export { mcpSandboxTypeDefs } from './sandbox.typeDefs';
export { ensureMcpSandbox } from './sandbox.org';

/**
 * The MCP sandbox: a demo visitor (or an employee) takes a short-lived, read-only MCP token for
 * the sandbox company and tries it from Claude or the browser playground. Tokens act as the
 * sandbox's analyst; a caller only ever sees and revokes their own.
 */
export const mcpSandboxResolvers = {
  Query: {
    mcpSandboxInfo: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      sandboxInfo(await demoCallerOf(ctx)),
    mcpSandboxTokens: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      sandboxTokens(await demoCallerOf(ctx)),
  },
  Mutation: {
    issueMcpSandboxToken: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      issueSandboxToken(await demoCallerOf(ctx), ctx.ip ?? ''),
    revokeMcpSandboxToken: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      revokeSandboxToken(await demoCallerOf(ctx), id, ctx.ip ?? ''),
  },
};
