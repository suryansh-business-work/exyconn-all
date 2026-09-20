import { websitePublicResolvers } from '../../src/modules/website/website.public.resolvers';
import { BlogPostModel, CaseStudyModel } from '../../src/modules/website/models';
import { useTestOrganization } from '../helpers';

/**
 * A future `publishedAt` is a schedule, not a decoration.
 *
 * The site used to show everything marked active whatever its date said, so writing next
 * week's post with next week's date published it today. These tests hold the site to the
 * date the editor chose.
 */

const DAY = 86_400_000;
const Q = websitePublicResolvers.Query;

const post = (title: string, publishedAt: Date, isActive = true) =>
  BlogPostModel.create({
    title,
    slug: title.toLowerCase().replaceAll(' ', '-'),
    excerpt: 'Something to read.',
    content: '<p>Something to read.</p>',
    category: 'Engineering',
    author: { name: 'Asha Rao', role: 'Engineer' },
    readTime: '3 min',
    publishedAt,
    isActive,
  });

describe('what the public site may see', () => {
  useTestOrganization();

  it('shows a post dated today and hides one dated next week', async () => {
    const now = new Date();
    await post('Out now', new Date(now.getTime() - DAY));
    await post('Next week', new Date(now.getTime() + 7 * DAY));

    const rows = (await Q.publicBlogPosts()) as unknown as { title: string }[];

    expect(rows.map((row) => row.title)).toEqual(['Out now']);
  });

  it('refuses a scheduled post by its own slug, so a leaked link shows nothing', async () => {
    await post('Embargoed', new Date(Date.now() + 2 * DAY));

    expect(await Q.publicBlogPost(null, { slug: 'embargoed' })).toBeNull();
  });

  it('still hides an inactive post whose date has passed', async () => {
    await post('Withdrawn', new Date(Date.now() - 2 * DAY), false);

    expect(await Q.publicBlogPosts()).toEqual([]);
  });

  it('holds a case study to its date too', async () => {
    await CaseStudyModel.create({
      title: 'Later',
      slug: 'later',
      client: 'Acme Ltd',
      category: 'Platform',
      summary: 'A summary.',
      content: '<p>A summary.</p>',
      publishedAt: new Date(Date.now() + 3 * DAY),
      isActive: true,
    });

    expect(await Q.publicCaseStudies()).toEqual([]);
    expect(await Q.publicCaseStudy(null, { slug: 'later' })).toBeNull();
  });
});
