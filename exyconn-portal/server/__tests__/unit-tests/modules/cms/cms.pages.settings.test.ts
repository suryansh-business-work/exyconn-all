import { Types } from 'mongoose';
import { cmsPages, type CmsPageSettingsInput } from '../../../../src/modules/cms/cms.pages';

const SITE = 'site-1';
const EDITOR = 'Asha';

const settings = (fields: Partial<CmsPageSettingsInput> = {}): CmsPageSettingsInput => ({
  path: '/about-us',
  title: 'About us',
  kind: 'PAGE',
  layout: 'default',
  ...fields,
});

const create = (fields: Partial<CmsPageSettingsInput> = {}, siteId = SITE) =>
  cmsPages.create(siteId, settings(fields), EDITOR);

describe('page settings', () => {
  it('stores a page with a tidy path, trimmed title and SEO defaults', async () => {
    const page = await create({ path: ' /about-us/ ', title: ' About us ', seo: null });

    expect(page).toMatchObject({
      siteId: SITE,
      path: '/about-us',
      title: 'About us',
      kind: 'PAGE',
      layout: 'default',
      status: 'DRAFT',
      updatedByName: EDITOR,
      seo: {
        title: '',
        description: '',
        keywords: '',
        ogImageUrl: '',
        canonical: '',
        noindex: false,
        jsonLd: null,
      },
    });
  });

  it('keeps the SEO settings it is given, trimmed', async () => {
    const jsonLd = { '@type': 'Organization' };

    const page = await create({
      seo: {
        title: ' About ',
        description: ' Who we are ',
        keywords: ' team ',
        ogImageUrl: ' https://img.test/a.png ',
        canonical: ' https://docs.test/about-us ',
        noindex: true,
        jsonLd,
      },
    });

    expect(page.seo).toEqual({
      title: 'About',
      description: 'Who we are',
      keywords: 'team',
      ogImageUrl: 'https://img.test/a.png',
      canonical: 'https://docs.test/about-us',
      noindex: true,
      jsonLd,
    });
  });

  it.each(['', '/', '///'])('reads the path %p as the home page', async (path) => {
    await expect(create({ path })).resolves.toMatchObject({ path: '/' });
  });

  it('accepts a template path with a parameter', async () => {
    await expect(create({ path: '/blog/:slug', kind: 'TEMPLATE' })).resolves.toMatchObject({
      path: '/blog/:slug',
      kind: 'TEMPLATE',
    });
  });

  it.each(['about', '/About', '/a b', '/blog/:Slug'])('refuses the path %p', async (path) => {
    await expect(create({ path })).rejects.toThrow(
      'Use a path like /about-us — lower-case letters, digits and dashes.',
    );
  });

  it('refuses a template without a parameter and a page with one', async () => {
    await expect(create({ path: '/blog', kind: 'TEMPLATE' })).rejects.toThrow(
      'A template needs a path with a parameter, like /blog/:slug.',
    );
    await expect(create({ path: '/blog/:slug' })).rejects.toThrow(
      'Only a template may have a parameter in its path.',
    );
  });

  it('refuses a page without a title', async () => {
    await expect(create({ title: '   ' })).rejects.toThrow('Give the page a title.');
  });

  it('refuses a path another page of the site lives at, but not on another site', async () => {
    await create();

    await expect(create()).rejects.toThrow('Another page already lives at /about-us.');
    await expect(create({}, 'site-2')).resolves.toMatchObject({ siteId: 'site-2' });
  });

  it('updates the settings, keeping its own path', async () => {
    const page = await create();

    const updated = await cmsPages.updateSettings(
      page._id.toHexString(),
      settings({ title: 'About', layout: 'bare' }),
      'Ravi',
    );

    expect(updated).toMatchObject({ title: 'About', layout: 'bare', updatedByName: 'Ravi' });
  });

  it('refuses moving a page onto another page path, and a page that does not exist', async () => {
    await create();
    const other = await create({ path: '/team' });

    await expect(
      cmsPages.updateSettings(other._id.toHexString(), settings(), EDITOR),
    ).rejects.toThrow('Another page already lives at /about-us.');
    await expect(
      cmsPages.updateSettings(new Types.ObjectId().toHexString(), settings(), EDITOR),
    ).rejects.toThrow('Page not found');
  });
});

/** The paths on a page of the list (the service returns its rows with ids only). */
const pathsOf = (page: { rows: unknown[] }) =>
  (page.rows as Array<{ path: string }>).map((row) => row.path);

describe('cmsPages.paged', () => {
  const seed = async () => {
    await create({ path: '/team', title: 'Our team' });
    await create({ path: '/', title: 'Home' });
    await create({ path: '/blog/:slug', title: 'Blog post', kind: 'TEMPLATE' });
    await create({ path: '/', title: 'Elsewhere' }, 'site-2');
  };

  it('lists a site pages by path without their documents', async () => {
    await seed();

    const page = await cmsPages.paged(SITE, { page: 0, pageSize: 10 });

    expect(page.totalCount).toBe(3);
    expect(pathsOf(page)).toEqual(['/', '/blog/:slug', '/team']);
    expect(page.rows[0]).not.toHaveProperty('draft');
    expect(page.rows[0].id).toEqual(expect.any(String));
  });

  it('filters by search, status and kind, and clamps the page', async () => {
    await seed();

    const search = await cmsPages.paged(SITE, { page: 0, pageSize: 10, search: ' TEAM ' });
    const templates = await cmsPages.paged(SITE, { page: 0, pageSize: 10, kind: 'TEMPLATE' });
    const published = await cmsPages.paged(SITE, { page: 0, pageSize: 10, status: 'PUBLISHED' });
    const clamped = await cmsPages.paged(SITE, { page: -2, pageSize: 0 });

    expect(pathsOf(search)).toEqual(['/team']);
    expect(pathsOf(templates)).toEqual(['/blog/:slug']);
    expect(published.totalCount).toBe(0);
    expect(pathsOf(clamped)).toEqual(['/']);
  });
});
