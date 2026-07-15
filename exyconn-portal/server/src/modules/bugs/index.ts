import { BugModel } from './bugs.model';
import { bugsTypeDefs } from './bugs.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface BugInput {
  title: string;
  description: string;
  severity: string;
  status: string;
  assignee: string;
  dueDate: Date;
}

export const bugsService = createCrudService<BugInput>(BugModel as never, 'Bug');
// Bugs belongs to the Projects domain in the consolidated role model.
export const bugsResolvers = createCrudResolvers(bugsService, {
  name: 'Bug',
  roles: [ROLES.PROJECTS],
  table: {
    searchFields: ['title', 'description', 'assignee'],
    filterFields: ['title', 'description', 'assignee', 'severity', 'status'],
    sortFields: ['title', 'assignee', 'severity', 'status', 'dueDate', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'severity'] },
});
export { bugsTypeDefs };
