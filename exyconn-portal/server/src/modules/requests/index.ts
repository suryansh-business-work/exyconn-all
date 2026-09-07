import { EmployeeRequestModel } from './request.model';
import { requestsTypeDefs } from './requests.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify, notifyBestEffort } from '../notifications';
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

/** HR's edit wraps the generated update so a decision reaches the employee who asked. */
const updateEmployeeRequest = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: EmployeeRequestInput };
  const before = await EmployeeRequestModel.findById(id).select('status').lean();
  const updated = await crud.Mutation.updateEmployeeRequest(p, args, ctx);
  if (before && before.status !== input.status) {
    const outcome = input.status.toLowerCase();
    await notifyBestEffort(input.employeeId, {
      kind: 'REQUEST',
      title: `Request ${outcome}: ${input.subject}`,
      body: input.decisionNote ?? `HR has ${outcome} your request.`,
      link: '/me/requests',
    });
  }
  return updated;
};

export const requestsResolvers = {
  Query: {
    ...crud.Query,
    myRequests: createMyRecordsResolver(EmployeeRequestModel as never, { createdAt: -1 }),
  },
  Mutation: { ...crud.Mutation, createMyRequest, updateEmployeeRequest },
};
export { requestsTypeDefs };
