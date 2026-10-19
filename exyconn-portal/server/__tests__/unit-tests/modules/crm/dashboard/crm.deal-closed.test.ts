import { DealModel } from '../../../../../src/modules/crm/deal.model';
import { backfillDealClosedAt } from '../../../../../src/modules/crm/crm.deal-closed.backfill';

const deal = (stage: string) =>
  DealModel.create({ title: 'Acme rollout', stage, value: 1000, owner: 'Asha' });

describe('the close date of a deal', () => {
  it('is stamped when a deal is created won, and empty while it is open', async () => {
    const won = await deal('WON');
    const open = await deal('PROPOSAL');

    expect(won.closedAt).toBeInstanceOf(Date);
    expect(open.closedAt).toBeNull();
  });

  it('is stamped when the stage moves to won and cleared when the deal is reopened', async () => {
    const row = await deal('NEGOTIATION');

    const won = await DealModel.findByIdAndUpdate(row._id, { stage: 'WON' }, { new: true }).lean();
    expect(won?.closedAt).toBeInstanceOf(Date);

    const reopened = await DealModel.findByIdAndUpdate(
      row._id,
      { $set: { stage: 'PROPOSAL' } },
      { new: true },
    ).lean();
    expect(reopened?.closedAt).toBeNull();
  });

  it('keeps the original close date when a won deal is saved again as won', async () => {
    const row = await deal('WON');
    const first = row.closedAt?.getTime();

    await new Promise((resolve) => setTimeout(resolve, 5));
    await DealModel.updateOne({ _id: row._id }, { stage: 'WON', value: 1200 });

    const saved = await DealModel.findById(row._id).lean();
    expect(saved?.closedAt?.getTime()).toBe(first);
  });

  it('leaves the date alone on an update that does not touch the stage', async () => {
    const row = await deal('LOST');
    const first = row.closedAt?.getTime();

    await DealModel.findByIdAndUpdate(row._id, { notes: 'Price' });

    expect((await DealModel.findById(row._id).lean())?.closedAt?.getTime()).toBe(first);
  });

  it('is backfilled from the last change for deals closed before it was kept', async () => {
    const updatedAt = new Date('2026-03-04T05:06:07.000Z');
    await DealModel.collection.insertMany([
      { title: 'Old win', stage: 'WON', value: 1, owner: 'A', updatedAt },
      { title: 'Old open', stage: 'PROPOSAL', value: 1, owner: 'A', updatedAt },
    ]);

    await backfillDealClosedAt();

    const win = await DealModel.findOne({ title: 'Old win' }).lean();
    const open = await DealModel.findOne({ title: 'Old open' }).lean();
    expect(win?.closedAt?.toISOString()).toBe(updatedAt.toISOString());
    expect(open?.closedAt ?? null).toBeNull();
  });
});
