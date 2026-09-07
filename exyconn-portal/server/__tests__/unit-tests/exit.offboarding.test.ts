import { ExitRecordModel } from '../../src/modules/exit/exit.model';
import { AssetModel } from '../../src/modules/assets/asset.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { exitResolvers } from '../../src/modules/exit';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const update = exitResolvers.Mutation.updateExitRecord as unknown as Resolver;
const hr = {
  user: { id: 'hr-1', email: 'hr@exyconn.com', roles: [ROLES.HR] },
} as unknown as GraphQLContext;

const leaver = () => seedUser('leaver@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);

const inputFor = (employeeId: string, stage: string) => ({
  employeeId,
  resignationDate: new Date('2026-01-05'),
  lastWorkingDate: new Date('2026-02-05'),
  noticePeriodDays: 30,
  reason: 'Relocating',
  stage,
  assetsReturned: false,
  knowledgeTransferDone: false,
  exitInterviewNotes: '',
  finalSettlementAmount: null,
  documentsIssued: false,
});

describe('updateExitRecord reaching EXITED', () => {
  it('deactivates the account and marks the employment terminated', async () => {
    const user = await leaver();
    const id = String(user._id);
    const record = await ExitRecordModel.create(inputFor(id, 'CLEARANCE'));

    await update(null, { id: String(record._id), input: inputFor(id, 'EXITED') }, hr);

    const after = await UserModel.findById(id).lean();
    expect(after?.isActive).toBe(false);
    expect(after?.employmentStatus).toBe('TERMINATED');
  });

  it('leaves the account alone for every earlier stage', async () => {
    const user = await leaver();
    const id = String(user._id);
    const record = await ExitRecordModel.create(inputFor(id, 'RESIGNED'));

    await update(null, { id: String(record._id), input: inputFor(id, 'NOTICE_PERIOD') }, hr);

    const after = await UserModel.findById(id).lean();
    expect(after?.isActive).toBe(true);
    expect(after?.employmentStatus).toBe('ACTIVE');
  });

  it('is refused for anyone outside HR', async () => {
    const record = await ExitRecordModel.create(inputFor('emp-1', 'CLEARANCE'));
    const emp = {
      user: { id: 'emp-1', email: 'e@exyconn.com', roles: [ROLES.EMPLOYEE] },
    } as unknown as GraphQLContext;

    await expect(
      update(null, { id: String(record._id), input: inputFor('emp-1', 'EXITED') }, emp),
    ).rejects.toThrow();
  });
});

describe('ExitRecord.heldAssets', () => {
  it('lists only what is still assigned to the leaver', async () => {
    await AssetModel.create({ assetTag: 'LT-1', name: 'Laptop', status: 'ASSIGNED', assignedToId: 'emp-1' });
    await AssetModel.create({ assetTag: 'MN-1', name: 'Monitor', status: 'ASSIGNED', assignedToId: 'emp-2' });
    await AssetModel.create({ assetTag: 'PH-1', name: 'Phone', status: 'IN_STOCK', assignedToId: '' });

    const held = (await exitResolvers.ExitRecord.heldAssets({ employeeId: 'emp-1' })) as {
      id: string;
      assetTag: string;
    }[];

    expect(held.map((a) => a.assetTag)).toEqual(['LT-1']);
    expect(typeof held[0].id).toBe('string');
  });
});
