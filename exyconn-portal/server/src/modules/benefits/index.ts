import { BenefitModel } from './benefit.model';
import { benefitsTypeDefs } from './benefits.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { ROLES } from '../../constants/roles';

interface BenefitInput {
  employeeId: string;
  kind: string;
  name: string;
  provider: string;
  reference: string;
  coverage: string;
  validFrom?: Date | null;
  validTo?: Date | null;
  documentUrl?: string | null;
}

export const benefitsService = createCrudService<BenefitInput>(BenefitModel as never, 'Benefit');

const crud = createCrudResolvers(benefitsService, {
  name: 'Benefit',
  roles: [ROLES.HR],
  table: {
    searchFields: ['name', 'provider', 'coverage'],
    filterFields: ['employeeId', 'kind'],
    sortFields: ['name', 'kind', 'validTo', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['kind'] },
});

export const benefitsResolvers = {
  Query: {
    ...crud.Query,
    myBenefits: createMyRecordsResolver(BenefitModel as never, { kind: 1 }),
  },
  Mutation: crud.Mutation,
};
export { benefitsTypeDefs };
