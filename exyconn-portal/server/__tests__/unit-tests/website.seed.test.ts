import { seedWebsiteContent } from '../../src/modules/website/seed';
import {
  BlogPostModel,
  CaseStudyModel,
  GigModel,
  JobCompanyModel,
  JobModel,
  NavLinkModel,
  ToolCategoryModel,
  ToolModel,
} from '../../src/modules/website/models';

/**
 * Guards the one-time migration of the content that used to be hardcoded in the Astro
 * website. If a fixture is dropped, mis-keyed, or the seed stops being idempotent, this
 * fails before the content reaches a real database.
 */
describe('seedWebsiteContent', () => {
  /** Expected counts, from the hardcoded data the website used to ship. */
  const EXPECTED = {
    blogPosts: 8,
    caseStudies: 40,
    jobCompanies: 4,
    jobs: 6,
    gigs: 1,
    toolCategories: 7,
    tools: 52,
    navLinks: 35,
  };

  async function counts() {
    return {
      blogPosts: await BlogPostModel.countDocuments(),
      caseStudies: await CaseStudyModel.countDocuments(),
      jobCompanies: await JobCompanyModel.countDocuments(),
      jobs: await JobModel.countDocuments(),
      gigs: await GigModel.countDocuments(),
      toolCategories: await ToolCategoryModel.countDocuments(),
      tools: await ToolModel.countDocuments(),
      navLinks: await NavLinkModel.countDocuments(),
    };
  }

  it('migrates every piece of the website content', async () => {
    await seedWebsiteContent();
    await expect(counts()).resolves.toEqual(EXPECTED);
  });

  it('is idempotent — re-seeding inserts nothing new', async () => {
    await seedWebsiteContent();
    await seedWebsiteContent();
    await expect(counts()).resolves.toEqual(EXPECTED);
  });

  it('never overwrites an edit made in the portal', async () => {
    await seedWebsiteContent();
    await BlogPostModel.updateOne(
      { slug: 'ai-automation-trends-2026' },
      { $set: { title: 'Edited in the portal' } },
    );

    await seedWebsiteContent();

    const post = await BlogPostModel.findOne({ slug: 'ai-automation-trends-2026' }).lean();
    expect(post?.title).toBe('Edited in the portal');
  });

  it('carries the article bodies across, not just the metadata', async () => {
    await seedWebsiteContent();

    const posts = await BlogPostModel.find().lean();
    expect(posts).toHaveLength(EXPECTED.blogPosts);
    for (const post of posts) {
      expect(post.content.length).toBeGreaterThan(0);
    }
  });

  it('preserves which tools the website actually publishes', async () => {
    await seedWebsiteContent();

    // The site rendered `items.filter((item) => item.isActive)`, so the 8 FAQ tools that
    // omitted the flag were hidden. Seeding must not silently publish them.
    await expect(ToolModel.countDocuments({ isActive: true })).resolves.toBe(44);
    await expect(ToolModel.countDocuments({ isActive: false })).resolves.toBe(8);
  });

  it('leaves no job pointing at a company that does not exist', async () => {
    await seedWebsiteContent();

    const companySlugs = new Set((await JobCompanyModel.find().lean()).map((c) => c.slug));
    const jobs = await JobModel.find().lean();

    expect(jobs).toHaveLength(EXPECTED.jobs);
    for (const job of jobs) {
      expect(companySlugs.has(job.companySlug)).toBe(true);
    }
  });

  it('leaves no tool pointing at a category that does not exist', async () => {
    await seedWebsiteContent();

    const categorySlugs = new Set((await ToolCategoryModel.find().lean()).map((c) => c.slug));
    const tools = await ToolModel.find().lean();

    expect(tools).toHaveLength(EXPECTED.tools);
    for (const tool of tools) {
      expect(categorySlugs.has(tool.categorySlug)).toBe(true);
    }
  });
});
