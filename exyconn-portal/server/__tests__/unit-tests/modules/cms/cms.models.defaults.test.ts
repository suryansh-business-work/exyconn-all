import {
  CmsDesignSystemModel,
  CmsPageModel,
  CmsSiteModel,
} from '../../../../src/modules/cms/models';

describe('what the CMS models fill in when a record names nothing', () => {
  it('gives a design system an empty token set of its own', async () => {
    const [first, second] = await CmsDesignSystemModel.create([
      { siteId: 'site-a', name: 'A' },
      { siteId: 'site-b', name: 'B' },
    ]);

    expect(first.tokens).toEqual({});
    expect(first.tokens).not.toBe(second.tokens);
  });

  it('gives a published page an empty block tree', async () => {
    const site = await CmsSiteModel.create({ name: 'Main', slug: 'main' });
    const page = await CmsPageModel.create({
      siteId: String(site._id),
      path: '/',
      title: 'Home',
      published: { publishedAt: new Date('2026-10-01T00:00:00Z') },
    });

    expect(page.published?.blocks).toEqual([]);
    expect(page.published?.css).toBe('');
  });
});
