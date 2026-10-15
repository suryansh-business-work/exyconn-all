import { workflowsService, type WorkflowDetailsInput } from './workflows.service';
import { actorOf } from './board.resolvers';
import { assertPermission } from '../../lib/permissions';
import type { PermissionAction } from '../permissions/permission.model';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

/** Workflows are Projects data: the PROJECTS role, then the admin matrix on Project. */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Project', [ROLES.PROJECTS], action);

export const workflowsResolvers = {
  /** The list leaves the drawing out; a `.lean()` row then has neither array. */
  ProjectWorkflow: {
    nodes: (workflow: { nodes?: unknown[] }) => workflow.nodes ?? [],
    edges: (workflow: { edges?: unknown[] }) => workflow.edges ?? [],
  },
  Query: {
    projectWorkflows: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return withIds(await workflowsService.list());
    },
    projectWorkflow: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return withId(await workflowsService.get(id));
    },
  },
  Mutation: {
    createProjectWorkflow: async (
      _p: unknown,
      { input }: { input: WorkflowDetailsInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      return withId(await workflowsService.create(input, await actorOf(ctx)));
    },
    updateProjectWorkflow: async (
      _p: unknown,
      { id, input }: { id: string; input: WorkflowDetailsInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      return withId(await workflowsService.updateDetails(id, input, await actorOf(ctx)));
    },
    saveProjectWorkflowGraph: async (
      _p: unknown,
      { id, graph }: { id: string; graph: unknown },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      return withId(await workflowsService.saveGraph(id, graph, await actorOf(ctx)));
    },
    deleteProjectWorkflow: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      return workflowsService.remove(id);
    },
  },
};
