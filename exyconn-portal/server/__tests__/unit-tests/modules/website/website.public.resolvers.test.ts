import { CmsSiteModel } from '../../../../src/modules/cms/models';
import { websitePublicResolvers } from '../../../../src/modules/website/website.public.resolvers';
import {
  BlogPostModel,
  CaseStudyModel,
  GigModel,
  JobCompanyModel,
  JobModel,
  NavLinkModel,
  ToolCategoryModel,
  ToolModel,
} from '../../../../src/modules/website/models';

const Q = websitePublicResolvers.Query;
const DAY = 86_400_000;

/** One column of a public list, in the order the site would render it. */
const column = (rows: unknown, key: string) =>
  (rows as Array<Record<string, unknown>>).map((row) => row[key]);

const company = (slug: string, extra: Record<string, unknown> = {}) =>
  JobCompanyModel.create({ companyCode: slug.toUpperCase(), slug, name: slug, ...extra });

const job = (jobCode: string, extra: Record<string, unknown> = {}) =>
  JobModel.create({
    jobCode,
    companySlug: 'acme',
    title: jobCode,
    category: 'Engineering',
    jobType: 'Full Time',
    experienceLevel: 'Senior',
    workMode: 'Remote',
    ...extra,
  });

const gig = (gigCode: string, extra: Record<string, unknown> = {}) =>
  GigModel.create({
    gigCode,
    title: gigCode,
    category: 'Design',
    duration: '1-2 weeks',
    applicationContact: 'gigs@exyconn.test',
    ...extra,
  });

describe('public blog posts and case studies', () => {
  it('lists published posts newest first and opens one by its slug', async () => {
    const older = await BlogPostModel.create({
      slug: 'older',
      title: 'Older',
      publishedAt: new Date(Date.now() - 3 * DAY),
    });
    await BlogPostModel.create({
      slug: 'newer',
      title: 'Newer',
      publishedAt: new Date(Date.now() - DAY),
    });

    expect(column(await Q.publicBlogPosts(), 'slug')).toEqual(['newer', 'older']);
    const post = await Q.publicBlogPost(null, { slug: 'older' });
    expect(post?.id).toBe(String(older._id));
    expect(post).toMatchObject({ title: 'Older', author: { name: 'Exyconn' } });
  });

  it('lists published case studies newest first and opens one by its slug', async () => {
    await CaseStudyModel.create({ slug: 'a', title: 'A', publishedAt: new Date(Date.now() - DAY) });
    await CaseStudyModel.create({ slug: 'b', title: 'B', publishedAt: new Date() });

    expect(column(await Q.publicCaseStudies(), 'slug')).toEqual(['b', 'a']);
    expect(await Q.publicCaseStudy(null, { slug: 'a' })).toMatchObject({ title: 'A' });
  });
});

describe('public careers', () => {
  it('lists active companies by their order, then by name, and hides the rest', async () => {
    await company('zeta', { order: 1 });
    await company('beta', { order: 2 });
    await company('alpha', { order: 2 });
    await company('hidden', { isActive: false });

    expect(column(await Q.publicJobCompanies(), 'slug')).toEqual(['zeta', 'alpha', 'beta']);
    expect(await Q.publicJobCompany(null, { slug: 'zeta' })).toMatchObject({ name: 'zeta' });
    expect(await Q.publicJobCompany(null, { slug: 'hidden' })).toBeNull();
  });

  it('gives a company that names no social links an empty set of them', async () => {
    await company('acme');

    const row = await Q.publicJobCompany(null, { slug: 'acme' });
    expect(row).toMatchObject({ socialLinks: { linkedin: '', twitter: '' } });
  });

  it('lists active jobs newest first, for every company or for one', async () => {
    await job('OLD', { jobPostDate: new Date(Date.now() - 2 * DAY) });
    await job('NEW', { jobPostDate: new Date() });
    await job('OTHER', { companySlug: 'other', jobPostDate: new Date(Date.now() - DAY) });
    await job('CLOSED', { isActive: false });

    expect(column(await Q.publicJobs(null, {}), 'jobCode')).toEqual(['NEW', 'OTHER', 'OLD']);
    expect(column(await Q.publicJobs(null, { companySlug: 'other' }), 'jobCode')).toEqual([
      'OTHER',
    ]);
  });

  it('opens an active job by its code and nothing for a closed one', async () => {
    await job('OPEN');
    await job('CLOSED', { isActive: false });

    expect(await Q.publicJob(null, { jobCode: 'OPEN' })).toMatchObject({ title: 'OPEN' });
    expect(await Q.publicJob(null, { jobCode: 'CLOSED' })).toBeNull();
  });

  it('lists every gig newest first and opens one by its code', async () => {
    await gig('GIG-1', { postedDate: new Date(Date.now() - DAY), status: 'completed' });
    await gig('GIG-2', { postedDate: new Date() });

    expect(column(await Q.publicGigs(), 'gigCode')).toEqual(['GIG-2', 'GIG-1']);
    expect(await Q.publicGig(null, { gigCode: 'GIG-1' })).toMatchObject({ status: 'completed' });
    expect(await Q.publicGig(null, { gigCode: 'GIG-404' })).toBeNull();
  });
});

describe('public tools', () => {
  beforeEach(async () => {
    await ToolCategoryModel.create([
      { slug: 'seo', category: 'SEO', order: 2 },
      { slug: 'text', category: 'Text', order: 1 },
      { slug: 'retired', category: 'Retired', isActive: false },
    ]);
    await ToolModel.create([
      { toolCode: 'SITEMAP', categorySlug: 'seo', name: 'Sitemap', order: 2 },
      { toolCode: 'COUNT', categorySlug: 'text', name: 'Counter', order: 1 },
      { toolCode: 'DRAFT', categorySlug: 'text', name: 'Draft', isActive: false },
    ]);
  });

  it('lists active categories in their order', async () => {
    expect(column(await Q.publicToolCategories(), 'slug')).toEqual(['text', 'seo']);
  });

  it('lists active tools in their order, for every category or for one', async () => {
    expect(column(await Q.publicTools(null, {}), 'toolCode')).toEqual(['COUNT', 'SITEMAP']);
    expect(column(await Q.publicTools(null, { categorySlug: 'seo' }), 'toolCode')).toEqual([
      'SITEMAP',
    ]);
  });

  it('opens an active tool by its code and nothing for an inactive one', async () => {
    expect(await Q.publicTool(null, { toolCode: 'COUNT' })).toMatchObject({ name: 'Counter' });
    expect(await Q.publicTool(null, { toolCode: 'DRAFT' })).toBeNull();
  });
});

describe('public navigation, per website', () => {
  it('serves the default site its own links and the ones filed under no site', async () => {
    const main = await CmsSiteModel.create({ name: 'Main', slug: 'main', isDefault: true });
    const shop = await CmsSiteModel.create({ name: 'Shop', slug: 'shop' });
    await NavLinkModel.create([
      { label: 'Home', href: '/', category: 'General', order: 1 },
      { label: 'About', href: '/about', category: 'Company', order: 2, siteId: String(main._id) },
      { label: 'Store', href: '/store', category: 'Products', siteId: String(shop._id) },
      { label: 'Old', href: '/old', category: 'General', isActive: false },
    ]);

    expect(column(await Q.publicNavLinks(), 'label')).toEqual(['Home', 'About']);
    expect(column(await Q.publicNavLinks(null, { site: 'MAIN' }), 'label')).toEqual([
      'Home',
      'About',
    ]);
    expect(column(await Q.publicNavLinks(null, { site: 'shop' }), 'label')).toEqual(['Store']);
  });

  it('keeps a post of one site off the others', async () => {
    await CmsSiteModel.create({ name: 'Main', slug: 'main', isDefault: true });
    const shop = await CmsSiteModel.create({ name: 'Shop', slug: 'shop' });
    await BlogPostModel.create({
      slug: 'sale',
      title: 'Sale',
      siteId: String(shop._id),
      publishedAt: new Date(Date.now() - DAY),
    });

    expect(await Q.publicBlogPost(null, { slug: 'sale' })).toBeNull();
    expect(await Q.publicBlogPost(null, { slug: 'sale', site: 'shop' })).toMatchObject({
      title: 'Sale',
    });
  });
});
