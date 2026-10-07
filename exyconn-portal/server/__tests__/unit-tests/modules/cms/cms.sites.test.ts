import { Types } from 'mongoose';
import { cmsSites, normalizeHost, type CmsSiteInput } from '../../../../src/modules/cms/cms.sites';
import { CmsDesignSystemModel, CmsSiteModel } from '../../../../src/modules/cms/models';
import { seedSite } from './cms.fixtures';

const input = (fields: Partial<CmsSiteInput> = {}): CmsSiteInput => ({
  name: ' Docs ',
  slug: 'docs',
  domains: [],
  status: 'ACTIVE',
  markets: false,
  defaultLocale: 'en',
  ...fields,
});

const missingId = () => String(new Types.ObjectId());

describe('normalizeHost', () => {
  it('keeps only the lower-case host name', () => {
    expect(normalizeHost(' HTTPS://Www.Example.com:8080/path ')).toBe('www.example.com');
    expect(normalizeHost('http://docs.test/a')).toBe('docs.test');
    expect(normalizeHost('plain.test')).toBe('plain.test');
  });
});

describe('cmsSites.create', () => {
  it('stores a normalised site with a design system of its own', async () => {
    const site = await cmsSites.create(
      input({
        slug: ' Docs ',
        domains: ['https://Docs.Test/', 'docs.test', '  '],
        defaultLocale: ' ',
        seo: { titleTemplate: ' ', description: ' About ', ogImageUrl: null },
      }),
    );

    expect(site).toMatchObject({
      name: 'Docs',
      slug: 'docs',
      domains: ['docs.test'],
      isDefault: false,
      defaultLocale: 'en',
      seo: { titleTemplate: '%s', description: 'About', ogImageUrl: '' },
      faviconUrl: '',
      headHtml: '',
      notFoundPageId: '',
    });
    const design = await CmsDesignSystemModel.findById(site.designSystemId).lean();
    expect(design).toMatchObject({ siteId: String(site._id), name: 'Docs design system' });
  });

  it('keeps a design system and the page chrome it was given', async () => {
    const chrome = {
      designSystemId: 'ds-1',
      headerFragmentId: 'header-1',
      footerFragmentId: 'footer-1',
      notFoundPageId: 'page-404',
      headHtml: '<meta>',
      bodyEndHtml: '<script></script>',
      globalCss: 'body{}',
    };

    const site = await cmsSites.create(input(chrome));

    expect(site).toMatchObject(chrome);
    await expect(CmsDesignSystemModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses a malformed key or domain', async () => {
    await expect(cmsSites.create(input({ slug: 'Not valid!' }))).rejects.toThrow(
      'Use lower-case letters, digits and dashes for the site key.',
    );
    await expect(cmsSites.create(input({ domains: ['bad_domain.test'] }))).rejects.toThrow(
      '"bad_domain.test" is not a valid domain.',
    );
  });

  it('refuses a domain another site answers on, and a key in use', async () => {
    await seedSite('main', { domains: ['main.test'] });

    await expect(cmsSites.create(input({ domains: ['Main.test'] }))).rejects.toThrow(
      'main.test already belongs to Main.',
    );
    await expect(cmsSites.create(input({ slug: 'main' }))).rejects.toThrow(
      'Another website already uses this key.',
    );
  });
});

describe('cmsSites.update', () => {
  it('saves new settings, keeping its own domains', async () => {
    const site = await seedSite('docs', { domains: ['docs.test'] });

    const updated = await cmsSites.update(
      String(site._id),
      input({ name: 'Docs v2', domains: ['docs.test', 'www.docs.test'], faviconUrl: ' /f.ico ' }),
    );

    expect(updated).toMatchObject({
      name: 'Docs v2',
      domains: ['docs.test', 'www.docs.test'],
      faviconUrl: '/f.ico',
    });
  });

  it('refuses a key or domain another site holds', async () => {
    await seedSite('main', { domains: ['main.test'] });
    const site = await seedSite('docs');

    await expect(cmsSites.update(String(site._id), input({ slug: 'main' }))).rejects.toThrow(
      'Another website already uses this key.',
    );
    await expect(
      cmsSites.update(String(site._id), input({ domains: ['main.test'] })),
    ).rejects.toThrow('main.test already belongs to Main.');
  });

  it('refuses a site that does not exist', async () => {
    await expect(cmsSites.update(missingId(), input())).rejects.toThrow('Website not found');
  });
});

describe('reading sites', () => {
  it('lists the default site first, then by name', async () => {
    await CmsSiteModel.create({ name: 'Zeta', slug: 'zeta' });
    await CmsSiteModel.create({ name: 'Alpha', slug: 'alpha' });
    await CmsSiteModel.create({ name: 'Home', slug: 'home', isDefault: true });

    const rows = await cmsSites.list();

    expect(rows.map((row) => row.name)).toEqual(['Home', 'Alpha', 'Zeta']);
  });

  it('finds a site by id and by key, whatever the key case', async () => {
    const site = await seedSite('docs');

    await expect(cmsSites.get(String(site._id))).resolves.toMatchObject({ slug: 'docs' });
    await expect(cmsSites.bySlug('DOCS')).resolves.toMatchObject({ name: 'Main' });
  });

  it('says when a site does not exist', async () => {
    await expect(cmsSites.get(missingId())).rejects.toThrow('Website not found');
    await expect(cmsSites.bySlug('nope')).rejects.toThrow('Website not found');
  });
});

describe('default site', () => {
  it('moves the default to the chosen site', async () => {
    const first = await seedSite('first', { isDefault: true });
    const second = await seedSite('second');

    const updated = await cmsSites.setDefault(String(second._id));

    expect(updated).toMatchObject({ isDefault: true });
    await expect(CmsSiteModel.findById(first._id).lean()).resolves.toMatchObject({
      isDefault: false,
    });
  });

  it('refuses a site that does not exist', async () => {
    await expect(cmsSites.setDefault(missingId())).rejects.toThrow('Website not found');
  });
});

describe('cmsSites.remove', () => {
  it('deletes a site that is not the default', async () => {
    const site = await seedSite('docs');

    await expect(cmsSites.remove(String(site._id))).resolves.toBe(true);
    await expect(CmsSiteModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses the default site and a site that does not exist', async () => {
    const site = await seedSite('home', { isDefault: true });

    await expect(cmsSites.remove(String(site._id))).rejects.toThrow(
      'Make another website the default before deleting this one.',
    );
    await expect(cmsSites.remove(missingId())).rejects.toThrow('Website not found');
  });
});
