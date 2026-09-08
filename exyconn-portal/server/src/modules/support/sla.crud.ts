import { SupportSlaPolicyModel } from './sla-policy.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface SlaPolicyInput {
  priority: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  active: boolean;
}

export const supportSlaPolicyService = createCrudService<SlaPolicyInput>(
  SupportSlaPolicyModel as never,
  'SupportSlaPolicy',
);

/** Support › SLA Policies is an ordinary CRUD screen — one row per priority. */
export const supportSlaPolicyCrud = createCrudResolvers(supportSlaPolicyService, {
  name: 'SupportSlaPolicy',
  plural: 'SupportSlaPolicies',
  roles: [ROLES.SUPPORT],
  table: {
    searchFields: ['priority'],
    filterFields: ['priority', 'active'],
    sortFields: ['priority', 'firstResponseMinutes', 'resolutionMinutes', 'createdAt'],
    defaultSort: { field: 'resolutionMinutes', dir: 'ASC' },
  },
  stats: { countBy: ['priority', 'active'] },
});
