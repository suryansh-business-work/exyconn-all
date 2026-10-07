import mongoose, { Schema } from 'mongoose';
import { dropPlatformWideUniqueIndexes } from '../../../../src/lib/tenant';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { logger } from '../../../../src/utils/logger';

const RepairProbe = mongoose.model(
  'RepairProbe',
  new Schema({ code: { type: String, unique: true }, kind: String }),
);
// A platform model keeps whatever unique index it has: it is not one company's data.
const NavLinkProbe = mongoose.model('NavLink', new Schema({ href: String }));
// Never written to and never created, so it has no collection to list.
mongoose.model(
  'EmptyRepairProbe',
  new Schema({ name: String }, { autoCreate: false, autoIndex: false }),
);

const indexNames = async (model: mongoose.Model<never>) =>
  ((await model.collection.indexes()) as Array<{ name?: string }>).map((index) => index.name);

describe('dropPlatformWideUniqueIndexes', () => {
  let warn: jest.SpyInstance;

  beforeEach(async () => {
    warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    await Promise.all([RepairProbe.init(), UserModel.init(), NavLinkProbe.init()]);
  });

  afterEach(() => warn.mockRestore());

  it('drops a stray unique index that spans every company, and only that one', async () => {
    await RepairProbe.collection.createIndex({ code: 1 }, { unique: true, name: 'code_1' });
    await RepairProbe.collection.createIndex({ kind: 1 }, { name: 'kind_1' });
    await NavLinkProbe.collection.createIndex({ href: 1 }, { unique: true, name: 'href_1' });

    const dropped = await dropPlatformWideUniqueIndexes();

    expect(dropped).toEqual(['RepairProbe.code_1']);
    const left = await indexNames(RepairProbe as unknown as mongoose.Model<never>);
    expect(left).toEqual(expect.arrayContaining(['_id_', 'organizationId_1_code_1', 'kind_1']));
    expect(left).not.toContain('code_1');
    expect(await indexNames(NavLinkProbe as unknown as mongoose.Model<never>)).toContain('href_1');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('RepairProbe.code_1'));
  });

  it('keeps sign-in identity unique across the platform', async () => {
    const dropped = await dropPlatformWideUniqueIndexes();
    expect(dropped).toEqual([]);
    expect(await indexNames(UserModel as unknown as mongoose.Model<never>)).toContain('email_1');
    expect(warn).not.toHaveBeenCalled();
  });

  it('drops a unique index that mixes sign-in identity with another field', async () => {
    await UserModel.collection.createIndex(
      { email: 1, name: 1 },
      { unique: true, name: 'email_name' },
    );
    await expect(dropPlatformWideUniqueIndexes()).resolves.toEqual(['User.email_name']);
  });
});
