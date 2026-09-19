import { Types } from 'mongoose';
import { DepartmentModel } from '../../src/modules/hr/department.model';
import { PositionModel } from '../../src/modules/hr/position.model';
import { OrganizationModel } from '../../src/modules/organizations';
import { purgeDepartments } from '../../src/modules/hr/department.purge';
import { runAsPlatform, runForOrganization } from '../../src/lib/tenant';
import { useTestOrganization } from '../helpers';

useTestOrganization();

describe('purgeDepartments', () => {
  let other: string;

  beforeEach(async () => {
    await DepartmentModel.create({ name: 'Engineering' });
    await PositionModel.create({ name: 'Engineer', department: 'Engineering' });
    const created = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Other Co', slug: 'other-co', currency: 'USD' }),
    );
    other = String(created._id);
    await runForOrganization(other, () => DepartmentModel.create({ name: 'Engineering' }));
  });

  it('only counts without --confirm', async () => {
    expect(await purgeDepartments('test-co', false)).toMatchObject({
      departments: 1,
      positions: 1,
      deleted: false,
    });
    expect(await DepartmentModel.countDocuments()).toBe(1);
  });

  it("deletes that organization's departments and positions, and nobody else's", async () => {
    await purgeDepartments('test-co', true);

    expect(await DepartmentModel.countDocuments()).toBe(0);
    expect(await PositionModel.countDocuments()).toBe(0);
    expect(await runForOrganization(other, () => DepartmentModel.countDocuments())).toBe(1);
  });

  it('refuses an unknown organization', async () => {
    await expect(purgeDepartments(new Types.ObjectId().toHexString(), true)).rejects.toThrow(
      'No organization has the handle',
    );
  });
});
