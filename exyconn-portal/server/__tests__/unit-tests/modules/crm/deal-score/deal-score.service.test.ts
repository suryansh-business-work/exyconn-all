import { Types } from 'mongoose';
import { DealModel } from '../../../../../src/modules/crm/deal.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { CrmEmailMessageModel } from '../../../../../src/modules/gmail/gmail.models';
import {
  dealFacts,
  rescoredAfter,
  scoreDeal,
  scoreDealsOfContacts,
  scoreOpenDeals,
} from '../../../../../src/modules/crm/deal-score/deal-score.service';
import { crmEntitiesResolvers } from '../../../../../src/modules/crm';
import { logger } from '../../../../../src/utils/logger';
import { runForOrganization } from '../../../../../src/lib/tenant';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

const DAY = 86_400_000;
const NOW = new Date('2026-10-31T12:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

type LeanDeal = Parameters<typeof dealFacts>[0];

/** A deal whose dates are written straight to the collection, past the stage hooks. */
async function deal(fields: Record<string, unknown> = {}, dates: Record<string, Date | null> = {}) {
  const row = await DealModel.create({
    title: 'Acme rollout',
    owner: 'A',
    stage: 'PROPOSAL',
    ...fields,
  });
  await DealModel.collection.updateOne(
    { _id: row._id },
    { $set: { createdAt: daysAgo(90), stageEnteredAt: daysAgo(3), ...dates } },
  );
  return row._id.toHexString();
}

const activity = (relatedId: string, createdAt: Date, extra: Record<string, unknown> = {}) =>
  ActivityModel.create({ subject: 'Call', owner: 'A', relatedId, ...extra }).then((a) =>
    ActivityModel.collection.updateOne({ _id: a._id }, { $set: { createdAt } }),
  );

const email = (direction: 'IN' | 'OUT', participant: string, sentAt: Date) =>
  CrmEmailMessageModel.create({
    gmailId: new Types.ObjectId().toHexString(),
    threadId: 't1',
    direction,
    participants: [participant],
    sentAt,
  });

const leanDeal = async (id: string) => (await DealModel.findById(id).lean()) as unknown as LeanDeal;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('dealFacts', () => {
  it('counts activity on the deal, its contact and its company, and mail with the contact', async () => {
    const contact = await ContactModel.create({
      name: 'Ravi',
      email: 'ravi@acme.com',
      emails: [{ address: 'ravi.k@gmail.com', label: 'Personal', primary: false }],
    });
    const contactId = contact._id.toHexString();
    const id = await deal(
      { contactId, companyId: 'company-1', expectedCloseDate: daysAgo(1) },
      { stageEnteredAt: daysAgo(40) },
    );
    await activity(id, daysAgo(2));
    await activity(contactId, daysAgo(10), { done: false, dueDate: daysAgo(1), type: 'TASK' });
    await activity('company-1', daysAgo(45));
    await activity('someone-else', daysAgo(0));
    await email('IN', 'ravi.k@gmail.com', daysAgo(5));
    await email('OUT', 'ravi@acme.com', daysAgo(6));
    await email('OUT', 'ravi@acme.com', daysAgo(31));

    await expect(dealFacts(await leanDeal(id), NOW)).resolves.toEqual({
      stage: 'PROPOSAL',
      daysInStage: 40,
      closeDatePassed: true,
      daysSinceActivity: 2,
      activitiesLast30Days: 2,
      overdueTasks: 1,
      emailsInLast30Days: 1,
      emailsOutLast30Days: 1,
    });
  });

  it('reads a deal with no contact, no activity and no stage stamp as idle since it was made', async () => {
    const id = await deal({}, { stageEnteredAt: null });

    await expect(dealFacts(await leanDeal(id), NOW)).resolves.toEqual({
      stage: 'PROPOSAL',
      daysInStage: 90,
      closeDatePassed: false,
      daysSinceActivity: null,
      activitiesLast30Days: 0,
      overdueTasks: 0,
      emailsInLast30Days: 0,
      emailsOutLast30Days: 0,
    });
  });

  it('reads mail for a contact saved before contacts had several addresses, as of now', async () => {
    const { insertedId } = await ContactModel.collection.insertOne({
      name: 'Legacy',
      email: 'legacy@acme.com',
    });
    const id = await deal({ contactId: insertedId.toHexString() });
    await email('IN', 'legacy@acme.com', new Date(Date.now() - DAY));

    await expect(dealFacts(await leanDeal(id))).resolves.toMatchObject({
      emailsInLast30Days: 1,
    });
  });

  it('finds no mail for a contact id that is malformed or no longer on file', async () => {
    const malformed = await deal({ contactId: 'not-an-id' });
    const deleted = await deal({ contactId: new Types.ObjectId().toHexString() });
    await email('IN', 'ravi@acme.com', daysAgo(1));

    await expect(dealFacts(await leanDeal(malformed), NOW)).resolves.toMatchObject({
      emailsInLast30Days: 0,
    });
    await expect(dealFacts(await leanDeal(deleted), NOW)).resolves.toMatchObject({
      emailsInLast30Days: 0,
    });
  });

  it('never counts a future stage stamp as negative days', async () => {
    const id = await deal({}, { stageEnteredAt: new Date(NOW.getTime() + DAY) });

    await expect(dealFacts(await leanDeal(id), NOW)).resolves.toMatchObject({ daysInStage: 0 });
  });
});

describe('scoreDeal', () => {
  it('stores the score, its reasons and when it was scored', async () => {
    const id = await deal();
    await activity(id, daysAgo(1));

    const scored = await scoreDeal(id, NOW);

    expect(scored).toMatchObject({ id, score: 65, scoredAt: NOW });
    expect(scored.scoreReasons).toEqual([
      { text: 'PROPOSAL stage', impact: 50 },
      { text: 'Activity in the last 7 days', impact: 10 },
      { text: 'Moved into this stage 3 day(s) ago', impact: 5 },
    ]);
    expect((await DealModel.findById(id).lean())?.score).toBe(65);
  });

  it('marks down a deal with no activity that has sat in its stage for months', async () => {
    const id = await deal({ stage: 'DISCOVERY' }, { stageEnteredAt: daysAgo(200) });

    await expect(scoreDeal(id, NOW)).resolves.toMatchObject({ score: 0 });
  });

  it('answers 404 for a malformed id, a missing deal and one deleted mid-score', async () => {
    await expect(scoreDeal('nope')).rejects.toThrow('Deal not found');
    await expect(scoreDeal(new Types.ObjectId().toHexString())).rejects.toThrow('Deal not found');

    const id = await deal();
    jest.spyOn(DealModel, 'findByIdAndUpdate').mockReturnValueOnce({
      lean: () => Promise.resolve(null),
    } as never);
    await expect(scoreDeal(id)).rejects.toThrow('Deal not found');
  });
});

describe('scoreOpenDeals and scoreDealsOfContacts', () => {
  it('rescores open deals only and says how many', async () => {
    const open = await deal();
    const won = await deal({ stage: 'WON' });

    await expect(scoreOpenDeals(NOW)).resolves.toBe(1);

    expect((await DealModel.findById(open).lean())?.score).not.toBeNull();
    expect((await DealModel.findById(won).lean())?.score).toBeNull();
  });

  it("scores only the company in scope's deals", async () => {
    const mine = new Types.ObjectId().toHexString();
    const theirs = new Types.ObjectId().toHexString();
    const myDeal = await runForOrganization(mine, () => deal());
    const theirDeal = await runForOrganization(theirs, () => deal());

    await expect(runForOrganization(mine, () => scoreOpenDeals(NOW))).resolves.toBe(1);

    const scores = await DealModel.find({ _id: { $in: [myDeal, theirDeal] } })
      .select('score')
      .lean();
    expect(scores.find((d) => String(d._id) === myDeal)?.score).not.toBeNull();
    expect(scores.find((d) => String(d._id) === theirDeal)?.score).toBeNull();
  });

  it("rescores the open deals of the given contacts and nobody else's", async () => {
    const theirs = await deal({ contactId: 'c1' });
    const closed = await deal({ contactId: 'c1', stage: 'LOST' });
    const other = await deal({ contactId: 'c2' });

    await scoreDealsOfContacts(['c1']);

    const score = async (id: string) => (await DealModel.findById(id).lean())?.score;
    expect(await score(theirs)).not.toBeNull();
    expect(await score(closed)).toBeNull();
    expect(await score(other)).toBeNull();
  });
});

describe('rescoredAfter', () => {
  /** The rescore runs after the answer; wait until it has written. */
  const scoredAt = async (id: string) => {
    for (let i = 0; i < 50; i += 1) {
      const row = await DealModel.findById(id).select('scoredAt').lean();
      if (row?.scoredAt) return row.scoredAt;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return null;
  };

  it('answers with what the save returned, then rescores that deal', async () => {
    const id = await deal();
    const save = jest.fn().mockResolvedValue({ id, title: 'Acme rollout' });

    await expect(rescoredAfter(save)(null, { id }, asSales)).resolves.toEqual({
      id,
      title: 'Acme rollout',
    });
    expect(save).toHaveBeenCalledWith(null, { id }, asSales);
    expect(await scoredAt(id)).toBeInstanceOf(Date);
  });

  it('logs a rescore that fails without failing the save', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const missing = new Types.ObjectId().toHexString();

    await expect(rescoredAfter(async () => ({ id: missing }))(null, {}, asSales)).resolves.toEqual({
      id: missing,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      `Deal ${missing} could not be rescored`,
    );
  });

  it('is wired into a stage change on the board', async () => {
    const id = await deal({ stage: 'QUALIFYING' });

    await crmEntitiesResolvers.Mutation.setDealStage(null, { id, stage: 'NEGOTIATION' }, asSales);

    expect(await scoredAt(id)).toBeInstanceOf(Date);
    expect((await DealModel.findById(id).lean())?.scoreReasons[0]).toEqual({
      text: 'NEGOTIATION stage',
      impact: 65,
    });
  });
});

describe('stageEnteredAt', () => {
  it('is stamped when a deal is made and when its stage changes, and kept otherwise', async () => {
    const created = await DealModel.create({ title: 'Acme rollout', owner: 'A' });
    const first = created.stageEnteredAt;
    expect(first).toBeInstanceOf(Date);

    await new Promise((resolve) => setTimeout(resolve, 5));
    await DealModel.findByIdAndUpdate(created._id, { value: 500 });
    expect((await DealModel.findById(created._id).lean())?.stageEnteredAt).toEqual(first);

    await DealModel.findByIdAndUpdate(created._id, { $set: { stage: 'DISCOVERY' } });
    const moved = (await DealModel.findById(created._id).lean())?.stageEnteredAt;
    expect(moved!.getTime()).toBeGreaterThan(first!.getTime());

    created.stage = 'PROPOSAL';
    await new Promise((resolve) => setTimeout(resolve, 5));
    await created.save();
    expect(created.stageEnteredAt!.getTime()).toBeGreaterThan(moved!.getTime());
  });
});
