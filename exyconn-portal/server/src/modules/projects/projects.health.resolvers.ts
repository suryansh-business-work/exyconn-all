import { ProjectModel } from './projects.model';
import { projectHealth, projectHealthOverview } from './projects.health';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.PROJECTS]);

export const projectHealthResolvers = {
  Query: {
    projectHealth: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      const project = await ProjectModel.findById(id)
        .select('name key status clientName startDate endDate budgetHours')
        .lean();
      if (!project) notFound('Project');
      return projectHealth(project);
    },
    projectHealthOverview: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      guard(ctx);
      return projectHealthOverview();
    },
  },
};
