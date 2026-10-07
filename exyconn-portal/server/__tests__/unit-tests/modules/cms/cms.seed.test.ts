import { ensureCmsDefaults } from '../../../../src/modules/cms';
import {
  CmsDesignSystemModel,
  CmsFragmentModel,
  CmsPageModel,
  CmsSiteModel,
} from '../../../../src/modules/cms/models';
import { seedSite } from './cms.fixtures';

// A small seed in place of exyconn.com's: the logic under test is how a seed is applied.
jest.mock('../../../../src/modules/cms/seed/exyconn', () =>
  jest.requireActual('./cms.seed.fixture'),
);

const seededSite = () => CmsSiteModel.findOne({ slug: 'seeded' }).lean();

describe('ensureCmsDefaults', () => {
  it('creates the seed site on first boot as the default, live and complete', async () => {
    await ensureCmsDefaults();

    const site = await seededSite();
    expect(site).toMatchObject({ status: 'ACTIVE', isDefault: true, headHtml: '<meta name="x">' });
    const fragments = await CmsFragmentModel.find().lean();
    const ids = new Map(fragments.map((row) => [row.seedKey, String(row._id)]));
    expect(site).toMatchObject({
      headerFragmentId: ids.get('header'),
      footerFragmentId: ids.get('footer'),
    });
    expect(site?.seededKeys).toEqual(
      expect.arrayContaining(['fragment:header', 'fragment:footer', 'page:home', 'page:about']),
    );
    await expect(CmsDesignSystemModel.findById(site?.designSystemId).lean()).resolves.toMatchObject(
      { name: 'Seed design' },
    );
    expect(fragments.every((row) => row.status === 'PUBLISHED' && row.published)).toBe(true);

    const home = await CmsPageModel.findOne({ path: '/' }).lean();
    expect(home?.draft.html).toContain(`data-fragment-id="${ids.get('header')}"`);
    expect(home).toMatchObject({
      status: 'PUBLISHED',
      seedKey: 'home',
      updatedByName: 'Seed',
      published: {
        blocks: [
          { kind: 'fragment', fragmentId: ids.get('header') },
          { kind: 'html', html: '<p>Hi</p>' },
        ],
      },
    });
  });

  it('leaves a seed key that names no seeded fragment as it was written', async () => {
    await ensureCmsDefaults();

    const about = await CmsPageModel.findOne({ path: '/about' }).lean();
    expect(about?.draft.html).toBe('<p data-fragment-id="seed:ghost">About</p>');
  });

  it('seeds in full a site stored before it remembered its seed keys', async () => {
    const site = await seedSite('seeded', { isDefault: true });
    await CmsSiteModel.collection.updateOne({ _id: site._id }, { $unset: { seededKeys: '' } });

    await ensureCmsDefaults();

    await expect(seededSite()).resolves.toMatchObject({
      seededKeys: ['fragment:header', 'fragment:footer', 'page:home', 'page:about'],
    });
  });

  it('inserts nothing twice, and never brings back what an editor deleted', async () => {
    await ensureCmsDefaults();
    await CmsPageModel.deleteOne({ path: '/about' });

    await ensureCmsDefaults();

    await expect(CmsFragmentModel.countDocuments()).resolves.toBe(2);
    await expect(CmsPageModel.countDocuments()).resolves.toBe(1);
    await expect(CmsDesignSystemModel.countDocuments()).resolves.toBe(1);
  });

  it('keeps an existing site settings and skips a page path that is taken', async () => {
    const site = await seedSite('seeded', {
      isDefault: true,
      designSystemId: 'ds-existing',
      headerFragmentId: 'header-existing',
    });
    await CmsPageModel.create({ siteId: String(site._id), path: '/', title: 'Editor home' });

    await ensureCmsDefaults();

    const after = await seededSite();
    expect(after).toMatchObject({
      designSystemId: 'ds-existing',
      headerFragmentId: 'header-existing',
    });
    expect(after?.footerFragmentId).not.toBe('');
    expect(after?.seededKeys).toContain('page:home');
    await expect(CmsDesignSystemModel.countDocuments()).resolves.toBe(0);
    await expect(CmsPageModel.findOne({ path: '/' }).lean()).resolves.toMatchObject({
      title: 'Editor home',
    });
  });

  it('wears no header when the seeded header was deleted before', async () => {
    await seedSite('seeded', { seededKeys: ['fragment:header', 'page:home'] });

    await ensureCmsDefaults();

    const site = await seededSite();
    expect(site?.headerFragmentId).toBe('');
    expect(site?.footerFragmentId).not.toBe('');
    await expect(CmsFragmentModel.countDocuments()).resolves.toBe(1);
  });

  it('is not the default when another site already is', async () => {
    await seedSite('home', { isDefault: true });

    await ensureCmsDefaults();

    await expect(seededSite()).resolves.toMatchObject({ isDefault: false });
  });
});
