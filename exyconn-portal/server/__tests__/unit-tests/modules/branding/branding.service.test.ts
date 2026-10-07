import { BrandingModel } from '../../../../src/modules/branding/branding.model';
import { getBranding } from '../../../../src/modules/branding/branding.service';
import * as branding from '../../../../src/modules/branding';

/** A query whose `.lean()` rejects, the way a lost upsert race surfaces from the driver. */
const failingQuery = (error: unknown) =>
  ({ lean: () => Promise.reject(error) }) as unknown as ReturnType<
    typeof BrandingModel.findOneAndUpdate
  >;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getBranding under a first-read race', () => {
  it('reads the row the winning reader inserted when its own upsert hits a duplicate key', async () => {
    await BrandingModel.create({ key: 'global', businessName: 'Winner Co' });
    jest
      .spyOn(BrandingModel, 'findOneAndUpdate')
      .mockReturnValueOnce(failingQuery(Object.assign(new Error('E11000'), { code: 11_000 })));

    const result = await getBranding();

    expect(result.businessName).toBe('Winner Co');
  });

  it('rethrows any other database failure', async () => {
    jest
      .spyOn(BrandingModel, 'findOneAndUpdate')
      .mockReturnValueOnce(failingQuery(new Error('connection lost')));

    await expect(getBranding()).rejects.toThrow('connection lost');
  });

  it('treats a stored null as missing so the non-null fields still resolve', async () => {
    await BrandingModel.collection.insertOne({ key: 'global', slogan: null, loginPages: null });

    const result = await getBranding();

    expect(result.slogan).toBe(branding.BRANDING_DEFAULTS.slogan);
    expect(result.loginPages).toHaveLength(branding.LOGIN_PAGE_DEFAULTS.length);
  });
});
