import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { whatsappDemoTypeDefs } from './whatsappDemo.typeDefs';
import * as demos from './whatsappDemo.service';
import * as workflows from './whatsappDemo.workflows';
import { recordEvents, type WhatsappDemoEventInput } from './whatsappDemo.events';
import { aiStatus, parse, type ParseInput } from './whatsappDemo.parse';
import { stats } from './whatsappDemo.stats';
import { funnel, sessionDetail, sessions } from './whatsappDemo.sessions';
import type { TableQueryInput } from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * The WhatsApp Business demo at whatsapp-demo.exyconn.com.
 *
 * Two audiences, enforced here rather than by hiding screens: the chat (any signed-in
 * employee — ADMIN passes every role check) reads the published catalogue, records its
 * analytics and asks for AI parses; everything that edits content or reads analytics is the
 * company's administrators' (ADMIN, or the platform's SUPER_ADMIN).
 */
const chatUser = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.EMPLOYEE]);
const admin = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);

type Id = { id: string };
type Range = { from: string; to: string };

export const whatsappDemoResolvers = {
  Query: {
    whatsappDemoCatalog: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      chatUser(ctx);
      return demos.catalog();
    },
    whatsappDemoAiStatus: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      chatUser(ctx);
      return aiStatus();
    },
    whatsappDemos: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      admin(ctx);
      return demos.listDemos();
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
    whatsappDemoStats: (_p: unknown, { from, to }: Range, ctx: GraphQLContext) => {
      admin(ctx);
      return stats(from, to);
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
      args: { input: TableQueryInput; from?: string | null; to?: string | null },
      ctx: GraphQLContext,
    ) => {
      admin(ctx);
      return sessions(args.input, args.from, args.to);
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
    ) => recordEvents(ctx, chatUser(ctx), events),
    whatsappDemoParse: (_p: unknown, { input }: { input: ParseInput }, ctx: GraphQLContext) =>
      parse(ctx, chatUser(ctx), input),
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

export { whatsappDemoTypeDefs };
export { ensureWhatsappDemoSeeds } from './whatsappDemo.seed';
export { WhatsappDemoModel, WhatsappWorkflowModel } from './whatsappDemo.model';
export { WhatsappDemoEventModel, WhatsappDemoSessionModel } from './whatsappDemo.analytics.model';
