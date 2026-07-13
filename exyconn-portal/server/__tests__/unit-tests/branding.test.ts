import { BrandingModel } from '../../src/modules/branding/branding.model';
import { getBranding, updateBranding } from '../../src/modules/branding/branding.service';
import { BRANDING_DEFAULTS } from '../../src/modules/branding/branding.constants';

describe('branding', () => {
  it('creates the global document with defaults on first read', async () => {
    const branding = await getBranding();
    expect(branding.businessName).toBe(BRANDING_DEFAULTS.businessName);
    expect(branding.primaryColor).toBe(BRANDING_DEFAULTS.primaryColor);
  });

  it('fills in fields the stored document predates', async () => {
    // Inserted through the raw collection so Mongoose schema defaults are bypassed — this
    // is how a document written before a field existed actually looks, and it is what makes
    // a non-nullable GraphQL field resolve to null ("Cannot return null for Branding.x").
    await BrandingModel.collection.insertOne({
      key: 'global',
      businessName: 'Exyconn',
      primaryColor: '#111111',
    });

    const branding = await getBranding();

    // Missing fields come from the defaults...
    expect(branding.slogan).toBe(BRANDING_DEFAULTS.slogan);
    expect(branding.supportEmail).toBe(BRANDING_DEFAULTS.supportEmail);
    expect(branding.logoUrl).toBe('');
    // ...but stored values still win.
    expect(branding.primaryColor).toBe('#111111');
  });

  it('round-trips an update', async () => {
    await updateBranding({ businessName: 'Exyconn Group', primaryColor: '#ff0000' });

    const branding = await getBranding();

    expect(branding.businessName).toBe('Exyconn Group');
    expect(branding.primaryColor).toBe('#ff0000');
    // Untouched fields keep their defaults rather than becoming null.
    expect(branding.secondaryColor).toBe(BRANDING_DEFAULTS.secondaryColor);
  });

  it('keeps every non-nullable GraphQL field defined', async () => {
    await BrandingModel.collection.insertOne({ key: 'global' });

    const branding = await getBranding();

    // Every key the SDL declares non-null must be present, or the query blows up at runtime.
    for (const key of Object.keys(BRANDING_DEFAULTS)) {
      expect(branding[key as keyof typeof BRANDING_DEFAULTS]).toBeDefined();
    }
  });
});
