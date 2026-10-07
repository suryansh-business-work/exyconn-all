import { Types } from 'mongoose';
import { activeAccessOf } from '../../../../src/modules/itsm/access';
import { ItAccessRequestModel } from '../../../../src/modules/itsm/models';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { anonymous, itMutation as m, itStaff, person } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type AccessRow = { id: string; status: string; employeeName: string; requestedById: string };

describe('IT access requests', () => {
  useTestOrganization();
  let ctx: GraphQLContext;
  let itId: string;
  let asha: string;

  beforeEach(async () => {
    ({ id: itId, ctx } = await itStaff());
    asha = await person('Asha Rao');
  });

  const input = (employeeId: string, application = 'Figma', kind = 'GRANT') => ({
    employeeId,
    application,
    kind,
    reason: 'Needs it for work',
  });

  const open = (application = 'Figma', kind = 'GRANT') =>
    m.createItAccessRequest(
      null,
      { input: input(asha, application, kind) },
      ctx,
    ) as Promise<AccessRow>;

  it('stamps the requester from the token', async () => {
    const created = await open();

    expect(created).toMatchObject({ requestedById: itId, employeeName: 'Asha Rao' });
  });

  it('refuses an employee id that names nobody, and a caller who is not signed in', async () => {
    const ghost = String(new Types.ObjectId());

    await expect(m.createItAccessRequest(null, { input: input(ghost) }, ctx)).rejects.toThrow(
      'That employee no longer exists',
    );
    expect(await codeOf(m.createItAccessRequest(null, { input: input(asha) }, anonymous))).toBe(
      'UNAUTHENTICATED',
    );
  });

  it('edits a pending request and refreshes the employee name', async () => {
    const created = await open();
    const bo = await person('Bo Lee');

    const updated = (await m.updateItAccessRequest(
      null,
      { id: created.id, input: input(bo, 'Miro') },
      ctx,
    )) as { employeeName: string; application: string };

    expect(updated).toMatchObject({ employeeName: 'Bo Lee', application: 'Miro' });
  });

  it('refuses to edit a decided request, or one that does not exist', async () => {
    const created = await open();
    await m.decideItAccessRequest(null, { id: created.id, decision: 'APPROVED' }, ctx);

    await expect(
      m.updateItAccessRequest(null, { id: created.id, input: input(asha) }, ctx),
    ).rejects.toThrow('Only a pending request can be edited');
    expect(await codeOf(m.updateItAccessRequest(null, { id: 'x', input: input(asha) }, ctx))).toBe(
      'NOT_FOUND',
    );
  });

  it('tells the employee when IT has carried a request out', async () => {
    const created = await open('Google Workspace', 'PASSWORD_RESET');
    await m.decideItAccessRequest(null, { id: created.id, decision: 'APPROVED' }, ctx);

    const done = (await m.fulfilItAccessRequest(null, { id: created.id }, ctx)) as {
      status: string;
      fulfilledAt: Date;
    };

    expect(done.status).toBe('FULFILLED');
    expect(done.fulfilledAt).toBeInstanceOf(Date);
    const notice = await NotificationModel.findOne({ employeeId: asha }).lean();
    expect(notice?.title).toBe('IT has completed your password reset for Google Workspace');
  });

  it('cancels a pending or approved request but not a fulfilled one', async () => {
    const pending = await open('Slack');
    const approved = await open('Jira');
    const done = await open('Miro');
    for (const row of [approved, done]) {
      await m.decideItAccessRequest(null, { id: row.id, decision: 'APPROVED' }, ctx);
    }
    await m.fulfilItAccessRequest(null, { id: done.id }, ctx);

    const cancelled = (await m.cancelItAccessRequest(null, { id: pending.id }, ctx)) as AccessRow;
    const withdrawn = (await m.cancelItAccessRequest(null, { id: approved.id }, ctx)) as AccessRow;

    expect([cancelled.status, withdrawn.status]).toEqual(['CANCELLED', 'CANCELLED']);
    await expect(m.cancelItAccessRequest(null, { id: done.id }, ctx)).rejects.toThrow(
      'A fulfilled request cannot be moved to cancelled',
    );
  });
});

describe('activeAccessOf', () => {
  useTestOrganization();

  const fulfilled = (fields: Record<string, unknown>) =>
    ItAccessRequestModel.create({
      employeeId: 'emp-1',
      reason: 'r',
      status: 'FULFILLED',
      kind: 'GRANT',
      ...fields,
    });

  it('keeps the latest grant per application, whatever its casing', async () => {
    await fulfilled({ application: 'Figma', accessLevel: 'Viewer', fulfilledAt: new Date(1000) });
    await fulfilled({
      application: 'figma',
      kind: 'ROLE_CHANGE',
      accessLevel: 'Editor',
      fulfilledAt: new Date(2000),
    });

    const held = await activeAccessOf(['emp-1']);

    expect(held).toHaveLength(1);
    expect(held[0]).toMatchObject({ application: 'figma', accessLevel: 'Editor', expiresAt: null });
    expect(held[0].grantedAt).toEqual(new Date(2000));
  });

  it('dates a grant with no fulfilment stamp from when it was raised, and keeps its expiry', async () => {
    const expiresAt = new Date(Date.UTC(2027, 0, 1));
    const row = await fulfilled({ application: 'VPN', expiresAt });

    const [grant] = await activeAccessOf(['emp-1']);

    expect(grant.grantedAt).toEqual(row.createdAt);
    expect(grant.expiresAt).toEqual(expiresAt);
  });

  it('reads nothing for people with no fulfilled history', async () => {
    await ItAccessRequestModel.create({
      employeeId: 'emp-2',
      application: 'Slack',
      reason: 'r',
      status: 'APPROVED',
    });

    expect(await activeAccessOf(['emp-2', 'emp-3'])).toEqual([]);
  });
});
