import { EmployeeRequestModel } from '../../../../src/modules/requests/request.model';
import { requestsResolvers } from '../../../../src/modules/requests';
import { NotificationModel } from '../../../../src/modules/notifications';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { asArg } from '../../../mockAs';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const createMyRequest = requestsResolvers.Mutation.createMyRequest as unknown as Resolver;
const updateRequest = requestsResolvers.Mutation.updateEmployeeRequest as unknown as Resolver;
const decideRequest = requestsResolvers.Mutation.decideEmployeeRequest as unknown as Resolver;
const teamRequests = requestsResolvers.Query.teamRequests as unknown as Resolver;
const myRequests = requestsResolvers.Query.myRequests as unknown as Resolver;

const ctx = (id: string, roles: string[] = [ROLES.EMPLOYEE]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;
const anonymous = {} as GraphQLContext;

const EMP = 'emp-1';
const HR = 'hr-1';
const MISSING = '64b000000000000000000000';

const raise = (employeeId: string, over: Record<string, unknown> = {}) =>
  EmployeeRequestModel.create({
    employeeId,
    type: 'WFH',
    subject: 'WFH Friday',
    details: 'Plumber visit',
    ...over,
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('raising a request', () => {
  it('stamps the caller, forces PENDING and confirms it to them', async () => {
    const created = (await createMyRequest(
      null,
      { input: { type: 'DOCUMENT', subject: 'Address proof', details: 'For the bank' } },
      ctx(EMP),
    )) as { id: string; employeeId: string; status: string };

    expect(created.id).toEqual(expect.any(String));
    expect(created).toMatchObject({ employeeId: EMP, status: 'PENDING' });
    const note = await NotificationModel.findOne({ employeeId: EMP }).lean();
    expect(note?.title).toBe('Request submitted: Address proof');
    expect(note?.link).toBe('/me/requests');
  });

  it('refuses somebody who is not signed in', async () => {
    const input = { type: 'WFH', subject: 'x', details: 'y' };
    await expect(codeOf(createMyRequest(null, { input }, anonymous))).resolves.toBe(
      'UNAUTHENTICATED',
    );
    expect(await EmployeeRequestModel.countDocuments()).toBe(0);
  });

  it('lists only the caller’s own requests, newest first', async () => {
    await raise(EMP, { subject: 'Older', createdAt: new Date('2026-10-01T09:00:00Z') });
    await raise('emp-2', { subject: 'Theirs' });
    await raise(EMP, { subject: 'Newer', createdAt: new Date('2026-10-02T09:00:00Z') });

    const rows = (await myRequests(null, {}, ctx(EMP))) as Array<{ subject: string }>;

    expect(rows.map((row) => row.subject)).toEqual(['Newer', 'Older']);
  });
});

describe('HR editing a request', () => {
  const input = (status: string) => ({
    employeeId: EMP,
    type: 'WFH',
    subject: 'WFH Friday',
    details: 'Plumber visit',
    status,
  });

  it('refuses HR editing their own request, whatever employee the input names', async () => {
    const own = await raise(HR);

    await expect(
      codeOf(
        updateRequest(null, { id: String(own._id), input: input('APPROVED') }, ctx(HR, [ROLES.HR])),
      ),
    ).resolves.toBe('FORBIDDEN');
    expect((await EmployeeRequestModel.findById(own._id).lean())?.status).toBe('PENDING');
  });

  it('tells the employee the default outcome when the decision has no note', async () => {
    const row = await raise(EMP);

    await updateRequest(
      null,
      { id: String(row._id), input: input('REJECTED') },
      ctx(HR, [ROLES.HR]),
    );

    const note = await NotificationModel.findOne({ employeeId: EMP }).lean();
    expect(note?.title).toBe('Request rejected: WFH Friday');
    expect(note?.body).toBe('Your request was rejected.');
  });

  it('reports a request that does not exist', async () => {
    await expect(
      codeOf(updateRequest(null, { id: MISSING, input: input('APPROVED') }, ctx(HR, [ROLES.HR]))),
    ).resolves.toBe('NOT_FOUND');
    expect(await NotificationModel.countDocuments()).toBe(0);
  });
});

describe('deciding a request', () => {
  it('lets HR decide without a note, storing null and the default message', async () => {
    const row = await raise(EMP);

    const updated = (await decideRequest(
      null,
      { id: String(row._id), status: 'REJECTED' },
      ctx(HR, [ROLES.HR]),
    )) as { id: string; status: string; decisionNote: string | null; decidedAt: Date };

    expect(updated).toMatchObject({ id: String(row._id), status: 'REJECTED', decisionNote: null });
    expect(updated.decidedAt).toBeInstanceOf(Date);
    const note = await NotificationModel.findOne({ employeeId: EMP }).lean();
    expect(note?.body).toBe('Your request was rejected.');
  });

  it('stays quiet when the status does not change', async () => {
    const row = await raise(EMP);

    const updated = (await decideRequest(
      null,
      { id: String(row._id), status: 'PENDING', decisionNote: 'Need more detail' },
      ctx(HR, [ROLES.HR]),
    )) as { decisionNote: string };

    expect(updated.decisionNote).toBe('Need more detail');
    expect(await NotificationModel.countDocuments({ employeeId: EMP })).toBe(0);
  });

  it('refuses HR deciding their own request', async () => {
    const own = await raise(HR);

    await expect(
      codeOf(decideRequest(null, { id: String(own._id), status: 'APPROVED' }, ctx(HR, [ROLES.HR]))),
    ).resolves.toBe('FORBIDDEN');
    expect((await EmployeeRequestModel.findById(own._id).lean())?.status).toBe('PENDING');
  });

  it('reports a request that does not exist', async () => {
    await expect(
      codeOf(decideRequest(null, { id: MISSING, status: 'APPROVED' }, ctx(HR, [ROLES.HR]))),
    ).resolves.toBe('NOT_FOUND');
  });

  it('reports a request deleted between the check and the write', async () => {
    const row = await raise(EMP);
    jest
      .spyOn(EmployeeRequestModel, 'findByIdAndUpdate')
      .mockReturnValueOnce(asArg({ lean: async () => null }));

    await expect(
      codeOf(decideRequest(null, { id: String(row._id), status: 'APPROVED' }, ctx(HR, [ROLES.HR]))),
    ).resolves.toBe('NOT_FOUND');
    expect(await NotificationModel.countDocuments()).toBe(0);
  });
});

describe('a manager’s queue', () => {
  it('is empty for somebody who manages nobody', async () => {
    await raise(EMP);

    await expect(teamRequests(null, {}, ctx('nobody-reports-to-me'))).resolves.toEqual([]);
  });

  it('refuses somebody who is not signed in', async () => {
    await expect(codeOf(teamRequests(null, {}, anonymous))).resolves.toBe('UNAUTHENTICATED');
  });
});
