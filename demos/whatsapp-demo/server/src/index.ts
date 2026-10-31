import { assertRole } from '../../../../exyconn-portal/server/src/middleware/roleGuard';
import { ROLES } from '../../../../exyconn-portal/server/src/constants/roles';
import * as demos from './whatsappDemo.service';
import * as workflows from './whatsappDemo.workflows';
import { recordEvents, type EventActor, type WhatsappDemoEventInput } from './whatsappDemo.events';
import { aiStatus, parseAs, type ParseInput } from './whatsappDemo.parse';
import { stats } from './whatsappDemo.stats';
import { funnel, sessionDetail, sessions } from './whatsappDemo.sessions';
import type { TableQueryInput } from '../../../../exyconn-portal/server/src/utils/tableQuery';
import type { GraphQLContext } from '../../../../exyconn-portal/server/src/middleware/auth';
import { runForOrganization } from '../../../../exyconn-portal/server/src/lib/tenant';
import { channelOf } from '@exyconn/wa-flow';
import { actorNameOf } from '../../../../exyconn-portal/server/src/lib/actor';

/**
 * The WhatsApp Business demo at demos.exyconn.com/whatsapp-demo.
 *
 * Two audiences, enforced here rather than by hiding screens: the chat (any signed-in
 * employee — ADMIN passes every role check — or a demo visitor signed in with an emailed code)
 * reads the published catalogue, records its analytics and asks for AI parses; everything that edits content or reads analytics is the
 * company's administrators' (ADMIN, or the platform's SUPER_ADMIN) its Tech staff and its Agents
 * team, who run the agents from the Agents console.
 *
 * The same module serves both bot channels — the WhatsApp demo and the website chat agent —
 * picked by each query's `channel` (WhatsApp when a client names none).
 */
const admin = (ctx: GraphQLContext) =>
  assertRole(ctx, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TECH, ROLES.AGENTS]);

/**
 * Runs chat work for whoever may chat: a signed-in employee in their own company, or a demo
 * visitor (email-and-code sign-in) inside the company that owns the demos — the only company
 * data a visitor ever reaches.
 */
function asChatter<T>(ctx: GraphQLContext, work: () => Promise<T>): Promise<T> {
  const visitor = ctx.demoVisitor;
  if (visitor && !ctx.user) {
    return runForOrganization(visitor.organizationId, work);
  }
  assertRole(ctx, [ROLES.EMPLOYEE]);
  return work();
}

/** Who analytics and AI parses are recorded against: the visitor, or the employee from the token. */
async function chatActor(ctx: GraphQLContext): Promise<EventActor> {
  const visitor = ctx.demoVisitor;
  if (visitor && !ctx.user) {
    return { id: `visitor:${visitor.id}`, name: visitor.name, email: visitor.email };
  }
  const user = assertRole(ctx, [ROLES.EMPLOYEE]);
  return { id: user.id, name: await actorNameOf(ctx), email: user.email };
}

type Id = { id: string };
type Range = { from: string; to: string };
type ChannelArg = { channel?: string | null };

export const whatsappDemoResolvers = {
  Query: {
    whatsappDemoCatalog: (_p: unknown, { channel }: ChannelArg, ctx: GraphQLContext) =>
      asChatter(ctx, () => demos.catalog(channelOf(channel))),
    whatsappDemoAiStatus: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asChatter(ctx, () => aiStatus()),
    whatsappDemos: (_p: unknown, { channel }: ChannelArg, ctx: GraphQLContext) => {
      admin(ctx);
      return demos.listDemos(channelOf(channel));
    },
    whatsappWorkflows: (
      _p: unknown,
      { demoId }: { demoId?: string | null },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return workflows.listWorkflows(demoId);
    },
    whatsappWorkflow: (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      admin(ctx);
      return workflows.getWorkflow(id);
    },
    whatsappDemoStats: (
      _p: unknown,
      { from, to, channel }: Range & ChannelArg,
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return stats(from, to, channelOf(channel));
    },
    whatsappDemoFunnel: (
      _p: unknown,
      args: Range & { demoKey: string; workflow: string },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return funnel(args.demoKey, args.workflow, args.from, args.to);
    },
    whatsappDemoSessions: (
      _p: unknown,
      args: ChannelArg & { input: TableQueryInput; from?: string | null; to?: string | null },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return sessions(args.input, args.from, args.to, channelOf(args.channel));
    },
    whatsappDemoSession: (
      _p: unknown,
      { sessionId }: { sessionId: string },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return sessionDetail(sessionId);
    },
  },
  Mutation: {
    recordWhatsappDemoEvents: (
      _p: unknown,
      { events }: { events: WhatsappDemoEventInput[] },
      ctx: GraphQLContext,
    ) => asChatter(ctx, async () => recordEvents(await chatActor(ctx), events)),
    whatsappDemoParse: (_p: unknown, { input }: { input: ParseInput }, ctx: GraphQLContext) =>
      asChatter(ctx, async () => parseAs(await chatActor(ctx), input)),
    upsertWhatsappDemo: (
      _p: unknown,
      { id, input }: { id?: string | null; input: demos.WhatsappDemoInput },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return demos.upsertDemo(ctx, id, input);
    },
    createWhatsappWorkflow: (
      _p: unknown,
      { input }: { input: workflows.WorkflowCreateInput },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return workflows.createWorkflow(ctx, input);
    },
    saveWhatsappWorkflowDraft: (
      _p: unknown,
      { id, input }: Id & { input: workflows.WorkflowDraftInput },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return workflows.saveDraft(ctx, id, input);
    },
    publishWhatsappWorkflow: (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      admin(ctx);
      return workflows.publish(ctx, id);
    },
    discardWhatsappWorkflowDraft: (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      admin(ctx);
      return workflows.discardDraft(ctx, id);
    },
    duplicateWhatsappWorkflow: (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      admin(ctx);
      return workflows.duplicate(ctx, id);
    },
    deleteWhatsappWorkflow: (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      admin(ctx);
      return workflows.remove(ctx, id);
    },
  },
};

export { whatsappDemoTypeDefs } from './whatsappDemo.typeDefs';
export { ensureWhatsappDemoSeeds } from './whatsappDemo.seed';
export { WhatsappDemoModel, WhatsappWorkflowModel } from './whatsappDemo.model';
export { WhatsappDemoEventModel, WhatsappDemoSessionModel } from './whatsappDemo.analytics.model';
