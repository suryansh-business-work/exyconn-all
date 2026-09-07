import { ProjectModel } from './projects.model';
import { projectsTypeDefs } from './projects.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { clientNameFor } from '../clients';
import type { GraphQLContext } from '../../middleware/auth';

interface ProjectInput {
  name: string;
  description?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  clientId?: string | null;
  clientName?: string;
  budgetAmount?: number | null;
  budgetHours?: number | null;
}

export const projectsService = createCrudService<ProjectInput>(ProjectModel as never, 'Project');
const crud = createCrudResolvers(projectsService, {
  name: 'Project',
  roles: [ROLES.PROJECTS],
  table: {
    searchFields: ['name', 'description', 'key', 'clientName'],
    filterFields: ['name', 'description', 'status', 'key', 'clientName'],
    sortFields: [
      'name',
      'key',
      'description',
      'status',
      'clientName',
      'startDate',
      'endDate',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});

/** The client's name is looked up from its id here, never trusted from the form. */
async function withClientName(input: ProjectInput): Promise<ProjectInput> {
  return { ...input, clientName: await clientNameFor(input.clientId) };
}

const createProject = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: ProjectInput };
  const completed = { input: await withClientName(input) } as unknown as never;
  return crud.Mutation.createProject(p, completed, ctx);
};

const updateProject = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: ProjectInput };
  const completed = { id, input: await withClientName(input) } as unknown as never;
  return crud.Mutation.updateProject(p, completed, ctx);
};

export const projectsResolvers = {
  /** Written before the field existed, a `.lean()` row comes back without it. */
  Project: { clientName: (project: { clientName?: string | null }) => project.clientName ?? '' },
  Query: crud.Query,
  Mutation: { ...crud.Mutation, createProject, updateProject },
};
export { projectsTypeDefs };
export { boardTypeDefs } from './board.typeDefs';
export { boardResolvers } from './board.resolvers';
export { docsTypeDefs } from './docs.typeDefs';
export { docsResolvers } from './docs.resolvers';
