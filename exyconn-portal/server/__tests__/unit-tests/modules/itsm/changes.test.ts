import { Types } from 'mongoose';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { anonymous, HOUR, itMutation as m, itStaff } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type ChangeRow = {
  id: string;
  status: string;
  requestedById: string;
  implementedAt: Date | null;
};

const change = (status: string, type = 'NORMAL') => ({
  title: 'Upgrade Mongo',
  description: 'Minor version bump',
  type,
  risk: 'LOW',
  environment: 'STAGING',
  system: 'Database',
  status,
  plannedStart: new Date(Date.now() + HOUR),
  plannedEnd: new Date(Date.now() + 2 * HOUR),
});

describe('IT changes', () => {
  useTestOrganization();
  let ctx: GraphQLContext;
  let itId: string;

  beforeEach(async () => {
    ({ id: itId, ctx } = await itStaff());
  });

  const create = (status: string, type = 'NORMAL') =>
    m.createItChange(null, { input: change(status, type) }, ctx) as Promise<ChangeRow>;
  const update = (id: string, status: string, type = 'NORMAL') =>
    m.updateItChange(null, { id, input: change(status, type) }, ctx) as Promise<ChangeRow>;

  it('records who raised it and leaves a draft unstamped', async () => {
    const created = await create('DRAFT');

    expect(created).toMatchObject({ status: 'DRAFT', requestedById: itId, implementedAt: null });
  });

  it('stamps a pre-approved change that is recorded as already implemented', async () => {
    const created = await create('IMPLEMENTED', 'STANDARD');

    expect(created.implementedAt).toBeInstanceOf(Date);
  });

  it('keeps the first implementation time when the change is saved again', async () => {
    const created = await create('IMPLEMENTED', 'STANDARD');

    const saved = await update(created.id, 'IMPLEMENTED', 'STANDARD');

    expect(saved.implementedAt).toEqual(created.implementedAt);
  });

  it('schedules an approved change and lets the form keep it approved', async () => {
    const created = await create('PENDING_APPROVAL');
    await m.decideItChange(null, { id: created.id, decision: 'APPROVED' }, ctx);

    const kept = await update(created.id, 'APPROVED');
    const scheduled = await update(created.id, 'SCHEDULED');

    expect(kept.status).toBe('APPROVED');
    expect(scheduled.status).toBe('SCHEDULED');
  });

  it('tells the requester how their change was decided', async () => {
    const created = await create('PENDING_APPROVAL');

    const decided = (await m.decideItChange(
      null,
      { id: created.id, decision: 'REJECTED', note: 'Freeze week' },
      ctx,
    )) as ChangeRow;

    expect(decided.status).toBe('REJECTED');
    const notice = await NotificationModel.findOne({ employeeId: itId }).lean();
    expect(notice?.title).toBe('Change rejected: Upgrade Mongo');
  });

  it('refuses to update a change that does not exist', async () => {
    expect(await codeOf(update('nope', 'DRAFT'))).toBe('NOT_FOUND');
    expect(await codeOf(update(String(new Types.ObjectId()), 'DRAFT'))).toBe('NOT_FOUND');
  });

  it('refuses a caller who is not signed in', async () => {
    const attempt = m.createItChange(null, { input: change('DRAFT') }, anonymous);

    expect(await codeOf(attempt)).toBe('UNAUTHENTICATED');
  });

  it('keeps people outside IT from deciding', async () => {
    const created = await create('PENDING_APPROVAL');
    const outsider = { user: { id: itId, email: 'x@exyconn.com', roles: ['EMPLOYEE'] } };

    const attempt = m.decideItChange(
      null,
      { id: created.id, decision: 'APPROVED' },
      outsider as unknown as GraphQLContext,
    );

    expect(await codeOf(attempt)).toBe('FORBIDDEN');
  });
});
