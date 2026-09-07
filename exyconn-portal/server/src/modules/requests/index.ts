import { EmployeeRequestModel } from './request.model';
import { requestsTypeDefs } from './requests.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createMyRecordsResolver } from '../../lib/employeeScope';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { notify, notifyBestEffort } from '../notifications';
import { assertMayActFor, directReportIds, pendingOrRecent } from '../admin/reporting';
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

interface DecidedRequest {
  employeeId: string;
  subject: string;
  status: string;
  decisionNote?: string | null;
}

/** Tells the employee who asked what was decided, whoever decided it. */
function notifyDecision(row: DecidedRequest) {
  const outcome = row.status.toLowerCase();
  return notifyBestEffort(row.employeeId, {
    kind: 'REQUEST',
    title: `Request ${outcome}: ${row.subject}`,
    body: row.decisionNote ?? `Your request was ${outcome}.`,
    link: '/me/requests',
  });
}

/** HR's edit wraps the generated update so a decision reaches the employee who asked. */
const updateEmployeeRequest = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { id: string; input: EmployeeRequestInput };
  const { id } = args as unknown as { id: string };
  const before = await EmployeeRequestModel.findById(id).select('status').lean();
  const updated = await crud.Mutation.updateEmployeeRequest(p, args, ctx);
  if (before && before.status !== input.status) await notifyDecision(input);
  return updated;
};

interface DecideArgs {
  id: string;
  status: string;
  decisionNote?: string | null;
}

/** The decision alone — HR, or the employee's manager, without the rest of the record. */
async function decideEmployeeRequest(_p: unknown, args: DecideArgs, ctx: GraphQLContext) {
  const row = await EmployeeRequestModel.findById(args.id).lean();
  if (!row) notFound('EmployeeRequest');
  await assertMayActFor(ctx, row.employeeId, [ROLES.HR]);
  const updated = await EmployeeRequestModel.findByIdAndUpdate(
    args.id,
    { status: args.status, decisionNote: args.decisionNote ?? null, decidedAt: new Date() },
    { new: true },
  ).lean();
  if (!updated) notFound('EmployeeRequest');
  if (row.status !== updated.status) await notifyDecision(updated);
  return withId(updated);
}

/** A manager's queue: their reports' pending requests, plus what was decided lately. */
async function teamRequests(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const ids = await directReportIds(user.id);
  if (ids.length === 0) return [];
  const rows = await EmployeeRequestModel.find(pendingOrRecent(ids)).sort({ createdAt: -1 }).lean();
  return withIds(rows);
}

export const requestsResolvers = {
  Query: {
    ...crud.Query,
    myRequests: createMyRecordsResolver(EmployeeRequestModel as never, { createdAt: -1 }),
    teamRequests,
  },
  Mutation: { ...crud.Mutation, createMyRequest, updateEmployeeRequest, decideEmployeeRequest },
};
export { requestsTypeDefs };
