import { assetsResolvers } from '../../src/modules/assets';
import { AssetAssignmentModel } from '../../src/modules/assets/assignment.model';
import { holderOf, openAssignment, syncAssignment } from '../../src/modules/assets/assignments';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'a-strong-password';

const asIt = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.IT], email: 'it@exyconn.com' },
});

const admin = () => seedUser('it@exyconn.com', PASSWORD, [ROLES.IT]);

const BASE = {
  assetTag: 'EXY-0001',
  name: 'MacBook Pro 14',
  category: 'LAPTOP',
  status: 'IN_STOCK',
};

const createAsset = (ctx: GraphQLContext, input: Record<string, unknown>) =>
  assetsResolvers.Mutation.createAsset(null, { input } as never, ctx) as Promise<{ id: string }>;

const updateAsset = (ctx: GraphQLContext, id: string, input: Record<string, unknown>) =>
  assetsResolvers.Mutation.updateAsset(null, { id, input } as never, ctx);

const rowsFor = (assetId: string) =>
  AssetAssignmentModel.find({ assetId }).sort({ assignedAt: 1 }).lean();

describe('holderOf', () => {
  it('is the employee only while the asset is ASSIGNED', () => {
    expect(holderOf({ status: 'ASSIGNED', assignedToId: 'user-1' })).toBe('user-1');
  });

  it('is nobody once the status has moved on, whatever the field still says', () => {
    expect(holderOf({ status: 'IN_REPAIR', assignedToId: 'user-1' })).toBe('');
  });
});

describe('assignment history', () => {
  it('opens no row for an asset nobody holds', async () => {
    const ctx = asIt((await admin()).id);

    const asset = await createAsset(ctx, BASE);

    expect(await rowsFor(asset.id)).toHaveLength(0);
  });

  it('opens a row when an asset is created already assigned', async () => {
    const ctx = asIt((await admin()).id);

    const asset = await createAsset(ctx, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-1',
      assignedToName: 'Asha Rao',
    });

    const rows = await rowsFor(asset.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeName).toBe('Asha Rao');
    expect(rows[0].returnedAt).toBeNull();
    expect(rows[0].assignedByName).toBe('it');
  });

  it('closes the previous row and opens a new one when the asset changes hands', async () => {
    const ctx = asIt((await admin()).id);
    const asset = await createAsset(ctx, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-1',
      assignedToName: 'Asha Rao',
    });

    await updateAsset(ctx, asset.id, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-2',
      assignedToName: 'Ben Shah',
    });

    const rows = await rowsFor(asset.id);
    expect(rows).toHaveLength(2);
    expect(rows[0].employeeId).toBe('user-1');
    expect(rows[0].returnedAt).not.toBeNull();
    expect(rows[1].employeeId).toBe('user-2');
    expect(rows[1].returnedAt).toBeNull();
  });

  it('closes the open row when the status leaves ASSIGNED', async () => {
    const ctx = asIt((await admin()).id);
    const asset = await createAsset(ctx, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-1',
      assignedToName: 'Asha Rao',
    });

    await updateAsset(ctx, asset.id, { ...BASE, status: 'IN_REPAIR' });

    const rows = await rowsFor(asset.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].returnedAt).not.toBeNull();
    expect(await openAssignment(asset.id)).toBeNull();
  });

  it('leaves the open row alone when a save changes nothing about who holds it', async () => {
    const ctx = asIt((await admin()).id);
    const asset = await createAsset(ctx, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-1',
      assignedToName: 'Asha Rao',
    });
    const before = await openAssignment(asset.id);

    await updateAsset(ctx, asset.id, {
      ...BASE,
      name: 'MacBook Pro 14 (2024)',
      status: 'ASSIGNED',
      assignedToId: 'user-1',
      assignedToName: 'Asha Rao',
    });

    const rows = await rowsFor(asset.id);
    expect(rows).toHaveLength(1);
    expect(String(rows[0]._id)).toBe(String(before?._id));
    expect(rows[0].returnedAt).toBeNull();
  });

  it('never leaves a dangling open row behind an employee who has left', async () => {
    const ctx = asIt((await admin()).id);
    const asset = await createAsset(ctx, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'leaver',
      assignedToName: 'Priya Nair',
    });

    // Offboarding: the asset comes back to stock and the holder is cleared.
    await updateAsset(ctx, asset.id, { ...BASE, status: 'IN_STOCK', assignedToId: '' });
    // And is later handed to somebody else.
    await updateAsset(ctx, asset.id, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-9',
      assignedToName: 'Ravi Kumar',
    });

    const rows = await rowsFor(asset.id);
    const open = rows.filter((row) => row.returnedAt === null);
    expect(open).toHaveLength(1);
    expect(open[0].employeeId).toBe('user-9');
    expect(rows[0].employeeId).toBe('leaver');
    expect(rows[0].returnedAt).not.toBeNull();
  });

  it('closes the previous row at the moment the next one opens', async () => {
    const at = new Date('2026-09-07T09:00:00.000Z');
    await syncAssignment(
      'asset-x',
      { assetTag: 'EXY-9', status: 'ASSIGNED', assignedToId: 'a', assignedToName: 'A' },
      'IT',
      new Date('2026-09-01T09:00:00.000Z'),
    );

    await syncAssignment(
      'asset-x',
      { assetTag: 'EXY-9', status: 'ASSIGNED', assignedToId: 'b', assignedToName: 'B' },
      'IT',
      at,
    );

    const rows = await rowsFor('asset-x');
    expect(rows[0].returnedAt?.toISOString()).toBe(at.toISOString());
    expect(rows[1].assignedAt.toISOString()).toBe(at.toISOString());
  });
});

describe('assetAssignments', () => {
  it('lists every spell, most recent first', async () => {
    const ctx = asIt((await admin()).id);
    const asset = await createAsset(ctx, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-1',
      assignedToName: 'Asha Rao',
    });
    await updateAsset(ctx, asset.id, {
      ...BASE,
      status: 'ASSIGNED',
      assignedToId: 'user-2',
      assignedToName: 'Ben Shah',
    });

    const listed = await assetsResolvers.Query.assetAssignments(null, { assetId: asset.id }, ctx);

    expect(listed.map((row) => row.employeeId)).toEqual(['user-2', 'user-1']);
  });
});
