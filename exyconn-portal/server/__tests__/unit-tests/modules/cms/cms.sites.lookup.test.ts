import {
  defaultSiteId,
  siteForHost,
  siteIdFor,
  siteIdsFor,
} from '../../../../src/modules/cms/cms.sites';
import { seedSite } from './cms.fixtures';

describe('siteForHost', () => {
  it('serves the active site that claims the host', async () => {
    await seedSite('home', { isDefault: true });
    const docs = await seedSite('docs', { domains: ['docs.test'], status: 'ACTIVE' });

    const site = await siteForHost('https://DOCS.test:443/guide');

    expect(String(site._id)).toBe(String(docs._id));
  });

  it('serves the default site for a draft site, an unknown host or no host at all', async () => {
    const home = await seedSite('home', { isDefault: true });
    await seedSite('draft', { domains: ['draft.test'], status: 'DRAFT' });

    for (const host of ['draft.test', 'unknown.test', '']) {
      const site = await siteForHost(host);
      expect(String(site._id)).toBe(String(home._id));
    }
  });

  it('says so when there is neither a claiming site nor a default', async () => {
    await seedSite('docs');

    await expect(siteForHost('localhost')).rejects.toThrow('Website not found');
  });
});

describe('site ids', () => {
  it('is empty before any default site exists', async () => {
    await expect(defaultSiteId()).resolves.toBe('');
    await expect(siteIdFor(null)).resolves.toBe('');
    await expect(siteIdsFor(undefined)).resolves.toEqual(['']);
  });

  it('resolves a slug, or the default site when none is named', async () => {
    const home = await seedSite('home', { isDefault: true });
    const docs = await seedSite('docs');

    await expect(defaultSiteId()).resolves.toBe(String(home._id));
    await expect(siteIdFor('')).resolves.toBe(String(home._id));
    await expect(siteIdFor('DOCS')).resolves.toBe(String(docs._id));
    await expect(siteIdFor('nope')).resolves.toBe('');
  });

  it('lets the default site own records filed without a site', async () => {
    const home = await seedSite('home', { isDefault: true });
    const docs = await seedSite('docs');

    await expect(siteIdsFor('home')).resolves.toEqual([String(home._id), '']);
    await expect(siteIdsFor(null)).resolves.toEqual([String(home._id), '']);
    await expect(siteIdsFor('docs')).resolves.toEqual([String(docs._id)]);
  });
});
