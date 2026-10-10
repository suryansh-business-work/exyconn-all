import { Types } from 'mongoose';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { anonymous, itMutation as m, itStaff } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type PurchaseRow = {
  id: string;
  status: string;
  requestedById: string;
  receivedAt: Date | null;
};

const purchase = (status: string) => ({
  title: 'Monitors',
  kind: 'HARDWARE',
  quantity: 4,
  estimatedCost: 800,
  justification: 'New desks',
  status,
});

describe('IT purchase requests', () => {
  useTestOrganization();
  let ctx: GraphQLContext;
  let itId: string;

  beforeEach(async () => {
    ({ id: itId, ctx } = await itStaff());
  });

  const create = (status: string) =>
    m.createItPurchaseRequest(null, { input: purchase(status) }, ctx) as Promise<PurchaseRow>;
  const update = (id: string, status: string) =>
    m.updateItPurchaseRequest(null, { id, input: purchase(status) }, ctx) as Promise<PurchaseRow>;
  const approved = async () => {
    const created = await create('REQUESTED');
    await m.decideItPurchaseRequest(null, { id: created.id, decision: 'APPROVED' }, ctx);
    return created;
  };

  it('records who asked and opens without a delivery date', async () => {
    const created = await create('QUOTED');

    expect(created).toMatchObject({ status: 'QUOTED', requestedById: itId, receivedAt: null });
  });

  it('refuses a request that arrives already approved or already ordered', async () => {
    await expect(create('APPROVED')).rejects.toThrow('from the approval action');
    await expect(create('ORDERED')).rejects.toThrow('must be approved before it is ordered');
  });

  it('orders after approval without stamping delivery', async () => {
    const created = await approved();

    const ordered = await update(created.id, 'ORDERED');

    expect(ordered).toMatchObject({ status: 'ORDERED', receivedAt: null });
  });

  it('keeps the first delivery date when a received request is saved again', async () => {
    const created = await approved();
    const received = await update(created.id, 'RECEIVED');

    const saved = await update(created.id, 'RECEIVED');

    expect(received.receivedAt).toBeInstanceOf(Date);
    expect(saved.receivedAt).toEqual(received.receivedAt);
  });

  it('tells the requester about the decision', async () => {
    const created = await create('REQUESTED');

    await m.decideItPurchaseRequest(null, { id: created.id, decision: 'REJECTED' }, ctx);

    const notice = await NotificationModel.findOne({ employeeId: itId }).lean();
    expect(notice).toMatchObject({
      title: 'Purchase request rejected: Monitors',
      link: '/it/procurement',
    });
  });

  it('refuses to update a request that does not exist', async () => {
    expect(await codeOf(update('nope', 'QUOTED'))).toBe('NOT_FOUND');
    expect(await codeOf(update(new Types.ObjectId().toHexString(), 'QUOTED'))).toBe('NOT_FOUND');
  });

  it('refuses a caller who is not signed in', async () => {
    const attempt = m.createItPurchaseRequest(null, { input: purchase('REQUESTED') }, anonymous);

    expect(await codeOf(attempt)).toBe('UNAUTHENTICATED');
  });
});
