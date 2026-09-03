import { assetsService } from '../../src/modules/assets';
import { AssetModel } from '../../src/modules/assets/asset.model';

/** The shared CRUD service returns a lean document, so the id is read back explicitly. */
const idOf = (doc: unknown) => String((doc as { _id: unknown })._id);

const asset = {
  assetTag: 'EXY-0001',
  name: 'MacBook Pro 14',
  category: 'LAPTOP',
  status: 'IN_STOCK',
};

describe('Assets', () => {
  // Connecting does not wait for indexes — Mongoose builds them in the background — so the
  // unique constraint on `assetTag` can still be missing when the duplicate test inserts.
  // `init()` resolves once this model's indexes exist.
  beforeAll(() => AssetModel.init());

  it('defaults a new asset to unassigned and in stock', async () => {
    const created = await assetsService.create(asset);

    const saved = await AssetModel.findById(idOf(created)).lean();
    expect(saved?.status).toBe('IN_STOCK');
    expect(saved?.assignedToId).toBe('');
    expect(saved?.purchaseCost).toBe(0);
  });

  it('refuses a second asset with the same tag', async () => {
    await assetsService.create(asset);

    await expect(assetsService.create({ ...asset, name: 'Another laptop' })).rejects.toThrow();
  });

  it('records who an asset was handed to', async () => {
    const created = await assetsService.create(asset);

    await assetsService.update(idOf(created), {
      ...asset,
      status: 'ASSIGNED',
      assignedToId: 'user-1',
      assignedToName: 'Asha Rao',
    });

    const saved = await AssetModel.findById(idOf(created)).lean();
    expect(saved?.status).toBe('ASSIGNED');
    expect(saved?.assignedToName).toBe('Asha Rao');
  });

  it('rejects an unknown category', async () => {
    await expect(assetsService.create({ ...asset, category: 'SPACESHIP' })).rejects.toThrow();
  });
});
