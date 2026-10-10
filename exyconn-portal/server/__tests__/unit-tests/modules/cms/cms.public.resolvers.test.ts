import { Types } from 'mongoose';
import { cmsPublicResolvers } from '../../../../src/modules/cms/cms.public.resolvers';
import { publicSubscribe } from '../../../../src/modules/cms/cms.public';
import {
  CmsPageModel,
  NewsletterIssueModel,
  NewsletterSubscriberModel,
} from '../../../../src/modules/cms/models';
import { solvedCaptcha } from '../../../helpers';
import { seedSite } from './cms.fixtures';

const { Query, Mutation } = cmsPublicResolvers;

/** The addresses of a list of issues (returned with ids only in their type). */
const slugsOf = (rows: unknown[]) => (rows as Array<{ slug: string }>).map((row) => row.slug);

const issue = (siteId: string, slug: string, fields: Record<string, unknown> = {}) =>
  NewsletterIssueModel.create({ siteId, slug, title: slug, content: '<p>Body</p>', ...fields });

describe('public site and pages', () => {
  it('serves the site for a host, a page at a path and the sitemap paths', async () => {
    const site = await seedSite('main', { isDefault: true });
    const siteId = site._id.toHexString();
    await CmsPageModel.create({
      siteId,
      path: '/',
      title: 'Home',
      published: { blocks: [], css: '', publishedAt: new Date() },
    });

    await expect(Query.publicCmsSite(null, { host: 'localhost' })).resolves.toMatchObject({
      site: { id: siteId },
    });
    await expect(Query.publicCmsPage(null, { siteId, path: '/' })).resolves.toMatchObject({
      page: { title: 'Home', preview: false },
    });
    await expect(
      Query.publicCmsPage(null, { siteId, path: '/x', previewToken: null }),
    ).resolves.toBeNull();
    const paths = await Query.publicCmsPaths(null, { siteId });
    expect(paths.map((row) => row.path)).toEqual(['/']);
  });
});

describe('public newsletter issues', () => {
  it('lists the active issues of the named or default site, newest first, without bodies', async () => {
    const home = await seedSite('home', { isDefault: true });
    const docs = await seedSite('docs');
    await issue(home._id.toHexString(), 'old', { publishedAt: new Date('2026-01-01') });
    await issue(home._id.toHexString(), 'new', { publishedAt: new Date('2026-02-01') });
    await issue(home._id.toHexString(), 'hidden', { isActive: false });
    await issue(docs._id.toHexString(), 'docs-only');

    const byDefault = await Query.publicNewsletterIssues(null, {});
    const byName = await Query.publicNewsletterIssues(null, { site: 'docs' });

    expect(slugsOf(byDefault)).toEqual(['new', 'old']);
    expect(byDefault[0]).not.toHaveProperty('content');
    expect(byDefault[0].id).toEqual(expect.any(String));
    expect(slugsOf(byName)).toEqual(['docs-only']);
  });

  it('serves one active issue by its address, or nothing', async () => {
    const home = await seedSite('home', { isDefault: true });
    await issue(home._id.toHexString(), 'live');
    await issue(home._id.toHexString(), 'hidden', { isActive: false });

    await expect(Query.publicNewsletterIssue(null, { slug: 'live' })).resolves.toMatchObject({
      slug: 'live',
      content: '<p>Body</p>',
    });
    await expect(
      Query.publicNewsletterIssue(null, { slug: 'hidden', site: 'home' }),
    ).resolves.toBeNull();
  });
});

describe('newsletter sign-up from the website', () => {
  it('subscribes a reader who answers the security question', async () => {
    const site = await seedSite('home', { isDefault: true });

    await expect(
      Mutation.subscribeNewsletter(null, {
        input: { email: 'reader@example.test', name: 'Reader', source: '/blog' },
        captcha: solvedCaptcha(),
      }),
    ).resolves.toBe(true);

    await expect(NewsletterSubscriberModel.findOne().lean()).resolves.toMatchObject({
      siteId: site._id.toHexString(),
      email: 'reader@example.test',
      name: 'Reader',
      source: '/blog',
    });
  });

  it('subscribes a reader who gave no name and no page', async () => {
    await seedSite('home', { isDefault: true });

    await Mutation.subscribeNewsletter(null, {
      input: { site: 'home', email: 'quiet@example.test' },
      captcha: solvedCaptcha(),
    });

    await expect(NewsletterSubscriberModel.findOne().lean()).resolves.toMatchObject({
      email: 'quiet@example.test',
      name: '',
      source: '',
    });
  });

  it('refuses a wrong answer', async () => {
    await seedSite('home', { isDefault: true });
    const { token, answer } = solvedCaptcha();

    await expect(
      Mutation.subscribeNewsletter(null, {
        input: { site: 'home', email: 'reader@example.test' },
        captcha: { token, answer: String(Number(answer) + 1) },
      }),
    ).rejects.toThrow('The security check answer was wrong or has expired.');
    await expect(NewsletterSubscriberModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses a site that does not exist', async () => {
    const captcha = solvedCaptcha();

    await expect(
      Mutation.subscribeNewsletter(null, { input: { site: 'nope', email: 'a@b.test' }, captcha }),
    ).rejects.toThrow('Website not found');
    await expect(
      publicSubscribe(new Types.ObjectId().toHexString(), { email: 'a@b.test' }, captcha),
    ).rejects.toThrow('Website not found');
  });

  it('unsubscribes by the link token', async () => {
    const site = await seedSite('home', { isDefault: true });
    await NewsletterSubscriberModel.create({
      siteId: site._id.toHexString(),
      email: 'reader@example.test',
      unsubscribeToken: 'link-token-1',
    });

    await expect(Mutation.unsubscribeNewsletter(null, { token: 'link-token-1' })).resolves.toBe(
      true,
    );
    await expect(Mutation.unsubscribeNewsletter(null, { token: 'other' })).resolves.toBe(false);
  });
});
