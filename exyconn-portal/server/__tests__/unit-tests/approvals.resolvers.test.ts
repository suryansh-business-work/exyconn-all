import { Types } from 'mongoose';
import { approvalsResolvers } from '../../src/modules/approvals';
import { ApprovalDelegateModel } from '../../src/modules/approvals/delegate.model';
import { myDelegations } from '../../src/modules/approvals/delegates.service';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const DAY = 86_400_000;

type Delegation = { id: string; fromName: string; toName: string; note: string; active: boolean };
type Listing = { given: Delegation[]; held: Delegation[] };

const Query = approvalsResolvers.Query;
const Mutation = approvalsResolvers.Mutation;

async function person(name: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    isActive: true,
  });
  return user._id.toHexString();
}

const as = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.EMPLOYEE], email: 'somebody@exyconn.com' },
});

const anonymous: GraphQLContext = { user: null };

const span = (startOffsetDays: number, endOffsetDays: number) => ({
  fromDate: new Date(Date.now() + startOffsetDays * DAY),
  toDate: new Date(Date.now() + endOffsetDays * DAY),
});

describe('delegating approvals through the API', () => {
  it('always hands over the caller s own approvals, whatever else is sent', async () => {
    const me = await person('Asha Rao');
    const standIn = await person('Dev Shah');

    const created = await Mutation.delegateApprovals(
      null,
      { input: { toEmployeeId: standIn, ...span(-1, 1), note: 'Conference' } },
      as(me),
    );

    expect(created).toMatchObject({
      fromEmployeeId: me,
      fromName: 'Asha Rao',
      toName: 'Dev Shah',
      note: 'Conference',
      active: true,
    });
  });

  it('lists what the caller arranged and what they hold', async () => {
    const me = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    await Mutation.delegateApprovals(
      null,
      { input: { toEmployeeId: standIn, ...span(-1, 1) } },
      as(me),
    );

    const mine = (await Query.myApprovalDelegations(null, {}, as(me))) as Listing;
    const theirs = (await Query.myApprovalDelegations(null, {}, as(standIn))) as Listing;

    expect(mine.given).toHaveLength(1);
    expect(mine.held).toEqual([]);
    expect(theirs.held[0]).toMatchObject({ fromName: 'Asha Rao', note: '' });
  });

  it('reports a window that has not opened yet as inactive', async () => {
    const me = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    await Mutation.delegateApprovals(
      null,
      { input: { toEmployeeId: standIn, ...span(3, 5) } },
      as(me),
    );

    const { given } = (await Query.myApprovalDelegations(null, {}, as(me))) as Listing;

    expect(given[0].active).toBe(false);
  });

  it('ends a delegation only for the person who arranged it', async () => {
    const me = await person('Asha Rao');
    const standIn = await person('Dev Shah');
    const created = await Mutation.delegateApprovals(
      null,
      { input: { toEmployeeId: standIn, ...span(0, 2) } },
      as(me),
    );

    await expect(
      Mutation.endApprovalDelegation(null, { id: created.id }, as(standIn)),
    ).rejects.toThrow('Delegation not found');
    await expect(Mutation.endApprovalDelegation(null, { id: created.id }, as(me))).resolves.toBe(
      true,
    );
    expect(await ApprovalDelegateModel.countDocuments()).toBe(0);
  });

  it('refuses a stand-in who has no account at all', async () => {
    const me = await person('Asha Rao');

    await expect(
      Mutation.delegateApprovals(
        null,
        { input: { toEmployeeId: new Types.ObjectId().toHexString(), ...span(0, 1) } },
        as(me),
      ),
    ).rejects.toThrow('That person does not have an active account.');
  });

  it('refuses every delegation call without a signed-in user', async () => {
    expect(() => Query.myApprovalDelegations(null, {}, anonymous)).toThrow(
      'Authentication required',
    );
    expect(() =>
      Mutation.delegateApprovals(null, { input: { toEmployeeId: 'x', ...span(0, 1) } }, anonymous),
    ).toThrow('Authentication required');
    expect(() => Mutation.endApprovalDelegation(null, { id: 'x' }, anonymous)).toThrow(
      'Authentication required',
    );
  });

  it('reads the queue and the badge through the resolvers', async () => {
    const me = await person('Asha Rao');

    await expect(Query.myApprovals(null, { kind: 'LEAVE' }, as(me))).resolves.toMatchObject({
      items: [],
      totalCount: 0,
    });
    await expect(Query.myPendingApprovalCount(null, {}, as(me))).resolves.toBe(0);
  });
});

describe('a delegation whose people are gone', () => {
  it('shows blank names and an empty note rather than failing', async () => {
    const standIn = await person('Dev Shah');
    const goneId = new Types.ObjectId().toHexString();
    // Written straight to the collection: an older row with no note, from somebody since removed.
    await ApprovalDelegateModel.collection.insertOne({
      fromEmployeeId: goneId,
      toEmployeeId: standIn,
      fromDate: new Date(Date.now() - DAY),
      toDate: new Date(Date.now() + DAY),
    });

    const { held } = await myDelegations(standIn);

    expect(held).toHaveLength(1);
    expect(held[0]).toMatchObject({
      fromEmployeeId: goneId,
      fromName: '',
      toName: 'Dev Shah',
      note: '',
    });
  });
});
