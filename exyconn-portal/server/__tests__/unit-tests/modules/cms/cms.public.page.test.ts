import { Types } from 'mongoose';
import { publicPage, publicPaths } from '../../../../src/modules/cms/cms.public';
import { previewPageId, signPreviewToken } from '../../../../src/modules/cms/cms.preview';
import { CmsPageModel } from '../../../../src/modules/cms/models';

const SITE = 'site-1';
const LIVE_AT = new Date('2026-10-01T00:00:00.000Z');

const page = (fields: Record<string, unknown>) =>
  CmsPageModel.create({
    siteId: SITE,
    title: 'Page',
    published: {
      blocks: [{ kind: 'html', html: '<p>Live</p>' }],
      css: 'p{}',
      publishedAt: LIVE_AT,
    },
    ...fields,
  });

describe('publicPage', () => {
  it('serves the published page at an exact path', async () => {
    const row = await page({ path: '/about-us', title: 'About', seo: { title: 'About us' } });

    const result = await publicPage(SITE, '/about-us');

    expect(result).toEqual({
      page: expect.objectContaining({
        id: String(row._id),
        path: '/about-us',
        kind: 'PAGE',
        title: 'About',
        layout: 'default',
        blocks: [{ kind: 'html', html: '<p>Live</p>' }],
        css: 'p{}',
        publishedAt: LIVE_AT,
        params: {},
        preview: false,
      }),
      fragments: [],
    });
    expect(result?.page.seo).toMatchObject({ title: 'About us' });
  });

  it('serves the published template a path fits, with its decoded params', async () => {
    await page({ path: '/docs/:section/intro', kind: 'TEMPLATE' });
    await page({ path: '/blog/:slug', kind: 'TEMPLATE' });

    const result = await publicPage(SITE, '/blog/hello%20world');

    expect(result?.page).toMatchObject({ path: '/blog/:slug', params: { slug: 'hello world' } });
  });

  it.each(['/blog', '/blog/', '/news/hello', '/blog/a/b'])(
    'serves nothing at %p, which no template fits',
    async (path) => {
      await page({ path: '/blog/:slug', kind: 'TEMPLATE' });

      await expect(publicPage(SITE, path)).resolves.toBeNull();
    },
  );

  it('serves nothing for an unpublished page or one of another site', async () => {
    await page({ path: '/draft', published: null });
    await page({ path: '/elsewhere', siteId: 'site-2' });

    await expect(publicPage(SITE, '/draft')).resolves.toBeNull();
    await expect(publicPage(SITE, '/elsewhere')).resolves.toBeNull();
  });
});

describe('previews', () => {
  it('signs a token that names the page, and reads nothing from a forged one', () => {
    const pageId = String(new Types.ObjectId());

    expect(previewPageId(signPreviewToken(pageId))).toBe(pageId);
    expect(previewPageId('forged.token.value')).toBeNull();
  });

  it('shows a page draft, compiled on the fly, for a valid preview token', async () => {
    const row = await page({
      path: '/about-us',
      published: null,
      draft: { html: '<p>Draft</p>', css: 'b{}' },
    });

    const result = await publicPage(SITE, '/ignored', signPreviewToken(String(row._id)));

    expect(result?.page).toMatchObject({
      path: '/about-us',
      blocks: [{ kind: 'html', html: '<p>Draft</p>' }],
      css: 'b{}',
      publishedAt: expect.any(Date),
      preview: true,
      params: {},
    });
  });

  it('refuses an expired or forged preview token', async () => {
    await expect(publicPage(SITE, '/', 'forged')).rejects.toThrow(
      'This preview link has expired. Open a new one from the page editor.',
    );
  });

  it('refuses a preview of a page that is not on this site', async () => {
    const row = await page({ path: '/x', siteId: 'site-2' });

    await expect(publicPage(SITE, '/', signPreviewToken(String(row._id)))).rejects.toThrow(
      'Page not found',
    );
  });
});

describe('publicPaths', () => {
  it('lists published, indexable pages by path, without templates', async () => {
    await page({ path: '/team' });
    await page({ path: '/' });
    await page({ path: '/hidden', seo: { noindex: true } });
    await page({ path: '/draft', published: null });
    await page({ path: '/blog/:slug', kind: 'TEMPLATE' });
    await page({ path: '/other', siteId: 'site-2' });

    const paths = await publicPaths(SITE);

    expect(paths.map((row) => row.path)).toEqual(['/', '/team']);
    expect(paths[0].updatedAt).toEqual(expect.any(Date));
  });
});
