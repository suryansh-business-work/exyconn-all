import { cmsComponent, compileHtml } from '@exyconn/cms';
import { collectionPage } from '../../../../../../../src/modules/cms/seed/exyconn/pages/collection-seed';

describe('collectionPage', () => {
  it('builds a default-layout page from catalogue components placed with their defaults, in order', () => {
    const page = collectionPage({
      key: 'blog',
      path: '/blog',
      kind: 'PAGE',
      title: 'Blog',
      seo: { title: 'Blog | Exyconn', description: 'Posts' },
      components: ['blog.list', 'blog.article'],
    });

    expect(page).toMatchObject({
      key: 'blog',
      path: '/blog',
      kind: 'PAGE',
      title: 'Blog',
      layout: 'default',
      css: '',
    });
    expect(compileHtml(page.html, page.css).blocks).toEqual([
      {
        kind: 'component',
        key: 'blog.list',
        props: cmsComponent('blog.list')?.defaultProps,
        children: [],
      },
      {
        kind: 'component',
        key: 'blog.article',
        props: cmsComponent('blog.article')?.defaultProps,
        children: [],
      },
    ]);
  });

  it('blanks the optional SEO fields so the site defaults apply', () => {
    const page = collectionPage({
      key: 'p',
      path: '/p',
      kind: 'PAGE',
      title: 'P',
      seo: { title: 'T', description: 'D' },
      components: ['blog.list'],
    });

    expect(page.seo).toEqual({
      title: 'T',
      description: 'D',
      keywords: '',
      ogImageUrl: '',
      canonical: '',
      noindex: false,
      jsonLd: null,
    });
  });

  it("keeps a template's brace placeholders in the SEO it is given", () => {
    const page = collectionPage({
      key: 'blog-article',
      path: '/blog/:slug',
      kind: 'TEMPLATE',
      title: 'Blog article',
      seo: {
        title: '{title} | Exyconn Blog',
        description: '{summary}',
        keywords: '{tags}',
        ogImageUrl: '{coverImage}',
      },
      components: ['blog.article'],
    });

    expect(page.kind).toBe('TEMPLATE');
    expect(page.seo).toMatchObject({ keywords: '{tags}', ogImageUrl: '{coverImage}' });
  });

  it('makes an empty page when it has no components', () => {
    const page = collectionPage({
      key: 'empty',
      path: '/empty',
      kind: 'PAGE',
      title: 'Empty',
      seo: { title: 'E', description: '' },
      components: [],
    });

    expect(page.html).toBe('');
  });

  it('throws for a component the catalogue does not have', () => {
    expect(() =>
      collectionPage({
        key: 'bad',
        path: '/bad',
        kind: 'PAGE',
        title: 'Bad',
        seo: { title: 'B', description: '' },
        components: ['blog.list', 'blog.nope'],
      }),
    ).toThrow('The CMS seed places "blog.nope", which is not in the component catalogue.');
  });
});
