import { Types } from 'mongoose';
import { DepartmentModel } from '../../src/modules/hr/department.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { dropPlatformWideUniqueIndexes, runForOrganization } from '../../src/lib/tenant';
import { duplicateMessage } from '../../src/graphql/formatError';
import { useTestOrganization } from '../helpers';

useTestOrganization();

const inOrganization = <T>(fn: () => Promise<T>) =>
  runForOrganization(new Types.ObjectId().toHexString(), fn);

describe('dropPlatformWideUniqueIndexes', () => {
  beforeEach(async () => {
    await DepartmentModel.syncIndexes();
  });

  it('frees a department name another company already uses', async () => {
    // What a collection created before the tenancy still carries.
    await DepartmentModel.collection.createIndex({ name: 1 }, { unique: true, name: 'name_1' });
    await DepartmentModel.create({ name: 'Engineering' });
    await expect(
      inOrganization(() => DepartmentModel.create({ name: 'Engineering' })),
    ).rejects.toThrow(/E11000/);

    const dropped = await dropPlatformWideUniqueIndexes();

    expect(dropped).toContain('Department.name_1');
    await expect(
      inOrganization(() => DepartmentModel.create({ name: 'Engineering' })),
    ).resolves.toBeTruthy();
  });

  it('keeps the name unique inside one company', async () => {
    await dropPlatformWideUniqueIndexes();
    await DepartmentModel.create({ name: 'Engineering' });
    await expect(DepartmentModel.create({ name: 'Engineering' })).rejects.toThrow(/E11000/);
  });

  it('leaves sign-in email unique across the platform', async () => {
    await UserModel.syncIndexes();
    const dropped = await dropPlatformWideUniqueIndexes();
    const indexes = await UserModel.collection.indexes();

    expect(dropped.filter((name) => name.startsWith('User.'))).toEqual([]);
    expect(indexes.some((index) => index.unique && Object.keys(index.key).join() === 'email')).toBe(
      true,
    );
  });
});

describe('duplicateMessage', () => {
  it('names the field that collided, never the organization or the value', () => {
    expect(duplicateMessage({ keyPattern: { organizationId: 1, name: 1 } })).toBe(
      'That name is already in use',
    );
    expect(duplicateMessage({})).toBe('That value is already in use');
  });
});
