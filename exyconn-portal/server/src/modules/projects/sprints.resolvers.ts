import { sprintsService, type MilestoneInput, type SprintInput } from './sprints.service';
import { serializeTask } from './board.resolvers';
import { assertRole } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.PROJECTS]);

type ProjectScoped = { _id: unknown; projectId: { toString(): string } };

/** A sprint or milestone's project reference has to be a string for its GraphQL ID. */
const serialize = <T extends ProjectScoped>(doc: T) => ({
  ...withId(doc),
  projectId: doc.projectId.toString(),
});

export const sprintsResolvers = {
  Query: {
    projectSprints: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return (await sprintsService.sprints(projectId)).map((sprint) => serialize(sprint));
    },
    projectMilestones: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return (await sprintsService.milestones(projectId)).map((one) => serialize(one));
    },
    sprintCompletionPlan: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return sprintsService.completionPlan(id);
    },
  },
  Mutation: {
    createSprint: async (
      _p: unknown,
      { projectId, input }: { projectId: string; input: SprintInput },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serialize(await sprintsService.createSprint(projectId, input));
    },
    updateSprint: async (
      _p: unknown,
      { id, input }: { id: string; input: SprintInput },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serialize(await sprintsService.updateSprint(id, input));
    },
    deleteSprint: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return sprintsService.deleteSprint(id);
    },
    startSprint: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return serialize(await sprintsService.startSprint(id));
    },
    completeSprint: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return serialize(await sprintsService.completeSprint(id));
    },
    createMilestone: async (
      _p: unknown,
      { projectId, input }: { projectId: string; input: MilestoneInput },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serialize(await sprintsService.createMilestone(projectId, input));
    },
    updateMilestone: async (
      _p: unknown,
      { id, input }: { id: string; input: MilestoneInput },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serialize(await sprintsService.updateMilestone(id, input));
    },
    deleteMilestone: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return sprintsService.deleteMilestone(id);
    },
    setTaskSprint: async (
      _p: unknown,
      { taskId, sprintId }: { taskId: string; sprintId?: string | null },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serializeTask(await sprintsService.setTaskSprint(taskId, sprintId ?? null));
    },
    setTaskParent: async (
      _p: unknown,
      { taskId, parentTaskId }: { taskId: string; parentTaskId?: string | null },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return serializeTask(await sprintsService.setTaskParent(taskId, parentTaskId ?? null));
    },
  },
};
