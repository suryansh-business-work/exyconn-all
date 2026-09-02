import {
  LocationModel,
  TeamModel,
  GradeModel,
  EmploymentTypeModel,
  ShiftModel,
} from './orgmaster.models';
import { orgMasterTypeDefs } from './orgmaster.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

const locationCrud = createCrudResolvers(
  createCrudService<Record<string, unknown>>(LocationModel as never, 'Location'),
  {
    name: 'Location',
    plural: 'Locations',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name', 'code', 'city'],
      filterFields: ['name', 'code', 'city'],
      sortFields: ['name', 'code', 'city', 'state'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['active'] },
  },
);
const teamCrud = createCrudResolvers(
  createCrudService<Record<string, unknown>>(TeamModel as never, 'Team'),
  {
    name: 'Team',
    plural: 'Teams',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name', 'department', 'description'],
      filterFields: ['name', 'department', 'leadEmployeeId'],
      sortFields: ['name', 'department', 'leadEmployeeId', 'description'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['active'] },
  },
);
const gradeCrud = createCrudResolvers(
  createCrudService<Record<string, unknown>>(GradeModel as never, 'Grade'),
  {
    name: 'Grade',
    plural: 'Grades',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name', 'code'],
      filterFields: ['name', 'code', 'active'],
      sortFields: ['name', 'code', 'level', 'minSalary'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['active'] },
  },
);
const employmentTypeCrud = createCrudResolvers(
  createCrudService<Record<string, unknown>>(EmploymentTypeModel as never, 'EmploymentType'),
  {
    name: 'EmploymentType',
    plural: 'EmploymentTypes',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name', 'code', 'description'],
      filterFields: ['name', 'code', 'description'],
      sortFields: ['name', 'code', 'description'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['active'] },
  },
);
const shiftCrud = createCrudResolvers(
  createCrudService<Record<string, unknown>>(ShiftModel as never, 'Shift'),
  {
    name: 'Shift',
    plural: 'Shifts',
    roles: [ROLES.HR],
    table: {
      searchFields: ['name', 'code', 'startTime'],
      filterFields: ['name', 'code', 'startTime'],
      sortFields: ['name', 'code', 'startTime', 'endTime'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['active'] },
  },
);

const groups = [locationCrud, teamCrud, gradeCrud, employmentTypeCrud, shiftCrud];

export const orgMasterResolvers = {
  Query: Object.assign({}, ...groups.map((g) => g.Query)),
  Mutation: Object.assign({}, ...groups.map((g) => g.Mutation)),
};
export { orgMasterTypeDefs };
