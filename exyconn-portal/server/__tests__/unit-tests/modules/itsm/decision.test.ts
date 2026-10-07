import { Types, type Model } from 'mongoose';
import { decideRecord, type DecidableRecord } from '../../../../src/modules/itsm/decision';
import { changeDecision } from '../../../../src/modules/itsm/changes';
import { ItChangeModel } from '../../../../src/modules/itsm/models';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { HOUR, itStaff, person } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const model = ItChangeModel as unknown as Model<DecidableRecord>;

const change = (extra: Record<string, unknown> = {}) =>
  ItChangeModel.create({
    title: 'Rotate keys',
    description: 'Quarterly rotation',
    system: 'Vault',
    status: 'PENDING_APPROVAL',
    plannedStart: new Date(Date.now() + HOUR),
    plannedEnd: new Date(Date.now() + 2 * HOUR),
    ...extra,
  });

describe('decideRecord', () => {
  useTestOrganization();
  let ctx: GraphQLContext;

  beforeEach(async () => {
    ({ ctx } = await itStaff());
  });

  it('refuses an id that is not one, and one that names nothing', async () => {
    const decide = (id: string) =>
      decideRecord(model, changeDecision, { id, decision: 'APPROVED' }, ctx);

    expect(await codeOf(decide('nope'))).toBe('NOT_FOUND');
    await expect(decide(String(new Types.ObjectId()))).rejects.toThrow('Change not found');
  });

  it('refuses a record that is no longer waiting for a decision', async () => {
    const draft = await change({ status: 'DRAFT' });

    await expect(
      decideRecord(model, changeDecision, { id: String(draft._id), decision: 'APPROVED' }, ctx),
    ).rejects.toThrow('This change has already been decided');
  });

  it('stamps who decided, when and why, and tells the requester', async () => {
    const requester = await person('Raj Dev');
    const pending = await change({ requestedById: requester });

    const decided = (await decideRecord(
      model,
      changeDecision,
      { id: String(pending._id), decision: 'REJECTED', note: '  Not in a freeze  ' },
      ctx,
    )) as unknown as Record<string, unknown>;

    expect(decided).toMatchObject({
      id: String(pending._id),
      status: 'REJECTED',
      decidedByName: 'Ira Tech',
      decisionNote: 'Not in a freeze',
    });
    expect(decided.decidedAt).toBeInstanceOf(Date);
    const notice = await NotificationModel.findOne({ employeeId: requester }).lean();
    expect(notice).toMatchObject({
      kind: 'IT',
      title: 'Change rejected: Rotate keys',
      body: 'Not in a freeze',
      link: '/it/changes',
    });
  });

  it('records an empty note when none is given and tells nobody without a requester', async () => {
    const pending = await change();

    const decided = (await decideRecord(
      model,
      changeDecision,
      { id: String(pending._id), decision: 'APPROVED', note: null },
      ctx,
    )) as unknown as Record<string, unknown>;

    expect(decided.decisionNote).toBe('');
    expect(await NotificationModel.countDocuments()).toBe(0);
  });
});
