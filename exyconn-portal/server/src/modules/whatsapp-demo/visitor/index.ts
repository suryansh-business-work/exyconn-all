import { ROLES } from '../../../constants/roles';
import { assertPlatformStaff } from '../../../lib/platformAccess';
import { runForOrganization } from '../../../lib/tenant';
import type { GraphQLContext } from '../../../middleware/auth';
import type { TableQueryInput } from '../../../utils/tableQuery';
import {
  requestVisitorCode,
  verifyVisitorCode,
  type CaptchaAnswer,
  type VisitorCodeInput,
} from './visitor.code';
import {
  deleteVisitor,
  getVisitor,
  listVisitors,
  setVisitorBlocked,
  visitorStats,
} from './visitor.service';

export { whatsappDemoVisitorTypeDefs } from './visitor.typeDefs';
export { VISITOR_HEADER } from './visitor.token';
export { visitorForPass, type DemoVisitor } from './visitor.service';

/** The leads list sits with the website's own form submissions, under the same permission. */
const LEADS_MODULE = 'WebsiteSubmission';
const LEADS_ROLES = [ROLES.WEBSITE];

/**
 * Email-and-code sign-in for prospects trying the WhatsApp demo, and the leads it files.
 *
 * Asking for and entering a code are public (rate-limited per address; the demo's own sign-in
 * per network too, the website with its security question instead);
 * `whatsappDemoVisitorMe` answers only for a request carrying a valid pass; the leads list is
 * the website team's.
 */
export const whatsappDemoVisitorResolvers = {
  Query: {
    whatsappDemoVisitorMe: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const visitor = ctx.demoVisitor;
      return visitor
        ? runForOrganization(visitor.organizationId, () => getVisitor(visitor.id))
        : null;
    },
    whatsappDemoVisitorsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await assertPlatformStaff(ctx, LEADS_MODULE, LEADS_ROLES, 'VIEW');
      return listVisitors(input);
    },
    whatsappDemoVisitorStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPlatformStaff(ctx, LEADS_MODULE, LEADS_ROLES, 'VIEW');
      return visitorStats();
    },
  },
  Mutation: {
    requestWhatsappDemoCode: (
      _p: unknown,
      { input, captcha }: { input: VisitorCodeInput; captcha?: CaptchaAnswer | null },
      ctx: GraphQLContext,
    ) => requestVisitorCode(input, ctx.ip ?? 'unknown', captcha ?? null),
    verifyWhatsappDemoCode: (_p: unknown, { email, code }: { email: string; code: string }) =>
      verifyVisitorCode(email, code),
    setWhatsappDemoVisitorBlocked: async (
      _p: unknown,
      { id, blocked }: { id: string; blocked: boolean },
      ctx: GraphQLContext,
    ) => {
      await assertPlatformStaff(ctx, LEADS_MODULE, LEADS_ROLES, 'EDIT');
      return setVisitorBlocked(id, blocked);
    },
    deleteWhatsappDemoVisitor: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await assertPlatformStaff(ctx, LEADS_MODULE, LEADS_ROLES, 'DELETE');
      return deleteVisitor(id);
    },
  },
};
