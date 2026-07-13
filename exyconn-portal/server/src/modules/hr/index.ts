import { LeaveRequestModel } from './hr.model';
import { DepartmentModel } from './department.model';
import { PositionModel } from './position.model';
import { hrTypeDefs } from './hr.typeDefs';
import { hrCustomResolvers } from './hr.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface LeaveRequestInput {
  employeeId: string;
  type: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: string;
}

interface DepartmentInput {
  name: string;
  description?: string;
}

interface PositionInput extends DepartmentInput {
  department: string;
}

const hrRoles = { roles: [ROLES.HR] };

const leaveCrudResolvers = createCrudResolvers(
  createCrudService<LeaveRequestInput>(LeaveRequestModel as never, 'LeaveRequest'),
  { name: 'LeaveRequest', ...hrRoles },
);
const departmentResolvers = createCrudResolvers(
  createCrudService<DepartmentInput>(DepartmentModel as never, 'Department'),
  { name: 'Department', ...hrRoles },
);
const positionResolvers = createCrudResolvers(
  createCrudService<PositionInput>(PositionModel as never, 'Position'),
  { name: 'Position', ...hrRoles },
);

/** Leave CRUD + departments/positions + self-service, per-employee views & dashboard. */
export const hrResolvers = {
  Query: {
    ...leaveCrudResolvers.Query,
    ...departmentResolvers.Query,
    ...positionResolvers.Query,
    ...hrCustomResolvers.Query,
  },
  Mutation: {
    ...leaveCrudResolvers.Mutation,
    ...departmentResolvers.Mutation,
    ...positionResolvers.Mutation,
    ...hrCustomResolvers.Mutation,
  },
};
export { hrTypeDefs };
