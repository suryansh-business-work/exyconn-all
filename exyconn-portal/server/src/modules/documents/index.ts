import { EmployeeDocumentModel } from './document.model';
import { documentsTypeDefs } from './documents.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { ROLES } from '../../constants/roles';

interface EmployeeDocumentInput {
  employeeId: string;
  kind: string;
  title: string;
  url: string;
  issuedOn: Date;
}

export const documentsService = createCrudService<EmployeeDocumentInput>(
  EmployeeDocumentModel as never,
  'EmployeeDocument',
);

const crud = createCrudResolvers(documentsService, {
  name: 'EmployeeDocument',
  roles: [ROLES.HR],
  table: {
    searchFields: ['title'],
    filterFields: ['employeeId', 'kind'],
    sortFields: ['title', 'kind', 'issuedOn', 'createdAt'],
    defaultSort: { field: 'issuedOn', dir: 'DESC' },
  },
  stats: { countBy: ['kind'] },
});

export const documentsResolvers = {
  Query: {
    ...crud.Query,
    myDocuments: createMyRecordsResolver(EmployeeDocumentModel as never, { issuedOn: -1 }),
  },
  Mutation: crud.Mutation,
};
export { documentsTypeDefs };
