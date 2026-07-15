import { ProjectModel } from './projects.model';
import { projectsTypeDefs } from './projects.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface ProjectInput {
  name: string;
  description?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
}

export const projectsService = createCrudService<ProjectInput>(ProjectModel as never, 'Project');
export const projectsResolvers = createCrudResolvers(projectsService, {
  name: 'Project',
  roles: [ROLES.PROJECTS],
  table: {
    searchFields: ['name', 'description'],
    filterFields: ['name', 'description', 'status'],
    sortFields: ['name', 'description', 'status', 'startDate', 'endDate', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
});
export { projectsTypeDefs };
export { boardTypeDefs } from './board.typeDefs';
export { boardResolvers } from './board.resolvers';
