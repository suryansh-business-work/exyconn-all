import { MigrationModel, runOnce } from '../../src/lib/migrations';
import { OrganizationModel } from '../../src/modules/organizations';
import { runAsPlatform, runForOrganization } from '../../src/lib/tenant';
import { useTestOrganization } from '../helpers';

useTestOrganization();

describe('runOnce', () => {
  it('runs a repair the first time and records it, then skips it', async () => {
    const work = jest.fn(async () => undefined);

    expect(await runOnce('fill-the-thing', work)).toBe(true);
    expect(await runOnce('fill-the-thing', work)).toBe(false);

    expect(work).toHaveBeenCalledTimes(1);
    expect(await MigrationModel.countDocuments({ name: 'fill-the-thing' })).toBe(1);
  });

  it('retries on the next boot when the repair threw', async () => {
    const work = jest.fn(async () => {
      throw new Error('Mongo went away');
    });

    await expect(runOnce('fragile', work)).rejects.toThrow('Mongo went away');
    expect(await MigrationModel.countDocuments({ name: 'fragile' })).toBe(0);
  });

  it('records a company repair for that company only, and a platform one once', async () => {
    const other = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Other Co', slug: 'other-co', currency: 'USD' }),
    );
    const work = jest.fn(async () => undefined);

    await runOnce('per-company', work);
    await runForOrganization(other._id.toHexString(), () => runOnce('per-company', work));
    await runAsPlatform(() => runOnce('platform-wide', work));
    await runAsPlatform(() => runOnce('platform-wide', work));

    expect(work).toHaveBeenCalledTimes(3);
    const all = await runAsPlatform(() => MigrationModel.find().lean());
    expect(all.filter((row) => row.name === 'per-company')).toHaveLength(2);
    expect(all.filter((row) => row.name === 'platform-wide')).toHaveLength(1);
  });
});
