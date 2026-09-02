import { EmployeeRequestModel } from './request.model';
import { requestsTypeDefs } from './requests.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify } from '../notifications';
import type { GraphQLContext } from '../../middleware/auth';

interface EmployeeRequestInput {
  employeeId: string;
  type: string;
  subject: string;
  details: string;
  status: string;
  decisionNote?: string | null;
}

export const requestsService = createCrudService<EmployeeRequestInput>(
  EmployeeRequestModel as never,
  'EmployeeRequest',
);

const crud = createCrudResolvers(requestsService, {
  name: 'EmployeeRequest',
  roles: [ROLES.HR],
  table: {
    searchFields: ['subject', 'details'],
    filterFields: ['employeeId', 'type', 'status'],
    sortFields: ['type', 'subject', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'type'] },
});

/** An employee raising their own request: id from the token, status forced to PENDING. */
async function createMyRequest(
  _p: unknown,
  { input }: { input: { type: string; subject: string; details: string } },
  ctx: GraphQLContext,
) {
  const user = assertAuthenticated(ctx);
  const created = await EmployeeRequestModel.create({
    ...input,
    employeeId: user.id,
    status: 'PENDING',
  });
  await notify(user.id, {
    kind: 'REQUEST',
    title: `Request submitted: ${input.subject}`,
    body: 'HR will review it and you will be notified of the decision.',
    link: '/me/requests',
  });
  return withId(created.toObject() as { _id: unknown });
}

export const requestsResolvers = {
  Query: {
    ...crud.Query,
    myRequests: createMyRecordsResolver(EmployeeRequestModel as never, { createdAt: -1 }),
  },
  Mutation: { ...crud.Mutation, createMyRequest },
};
export { requestsTypeDefs };
