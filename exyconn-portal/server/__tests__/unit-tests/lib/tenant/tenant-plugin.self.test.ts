import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import {
  organizationOf,
  runForOrganization,
  runInScope,
  type TenantScope,
} from '../../../../src/lib/tenant';

const home = new Types.ObjectId().toHexString();
const visited = new Types.ObjectId().toHexString();

async function seedPeople() {
  const admin = await runForOrganization(home, () =>
    UserModel.create({
      name: 'Platform Admin',
      email: 'pa@example.com',
      passwordHash: randomUUID(),
    }),
  );
  await runForOrganization(visited, () =>
    UserModel.create({ name: 'Local', email: 'local@example.com', passwordHash: randomUUID() }),
  );
  const scope: TenantScope = {
    organizationId: visited,
    platform: false,
    self: { userId: admin.id, organizationId: home },
  };
  return { admin, scope };
}

describe('a platform administrator working in another company', () => {
  it('still reaches their own account by its exact id, as a string or an ObjectId', async () => {
    const { admin, scope } = await seedPeople();
    const byString = await runInScope(scope, () => UserModel.findById(admin.id).lean().exec());
    const byObjectId = await runInScope(scope, () =>
      UserModel.findOne({ _id: admin._id }).lean().exec(),
    );
    expect(byString?.email).toBe('pa@example.com');
    expect(byObjectId?.email).toBe('pa@example.com');
  });

  it('does not appear in the visited company’s lists', async () => {
    const { admin, scope } = await seedPeople();
    const everyone = await runInScope(scope, () => UserModel.find().lean().exec());
    expect(everyone.map((user) => user.email)).toEqual(['local@example.com']);
    const byList = await runInScope(scope, () =>
      UserModel.find({ _id: { $in: [admin._id] } })
        .lean()
        .exec(),
    );
    expect(byList).toEqual([]);
  });

  it('can save their own account without it being moved into the visited company', async () => {
    const { admin, scope } = await seedPeople();
    await runInScope(scope, async () => {
      const own = await UserModel.findById(admin.id);
      if (!own) throw new Error('own account not reachable');
      own.name = 'Renamed';
      await own.save();
    });
    const stored = await runForOrganization(home, () => UserModel.findById(admin.id).lean());
    expect(stored?.name).toBe('Renamed');
    expect(stored && organizationOf(stored)).toBe(home);
  });

  it('cannot reach somebody else in their home company', async () => {
    const { scope } = await seedPeople();
    const colleague = await runForOrganization(home, () =>
      UserModel.create({ name: 'Colleague', email: 'co@example.com', passwordHash: randomUUID() }),
    );
    const found = await runInScope(scope, () => UserModel.findById(colleague.id).lean().exec());
    expect(found).toBeNull();
  });
});
