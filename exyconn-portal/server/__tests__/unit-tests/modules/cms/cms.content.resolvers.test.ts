import { cmsContentResolvers } from '../../../../src/modules/cms';
import { NewsletterSubscriberModel } from '../../../../src/modules/cms/models';
import { editorCtx } from './cms.fixtures';

const { Query, Mutation } = cmsContentResolvers;
const SITE = 'site-1';
const paging = { siteId: SITE, page: 0, pageSize: 10 };

const input = {
  siteId: SITE,
  slug: 'october',
  title: 'October',
  content: '<p>News</p>',
  isActive: true,
};

describe('newsletter issues for the website team', () => {
  it('creates, lists, updates and deletes an issue', async () => {
    const ctx = editorCtx();

    const created = await Mutation.createNewsletterIssue(null, { input }, ctx);
    expect(created).toMatchObject({ id: expect.any(String), slug: 'october' });

    const listed = await Query.newsletterIssues(null, { ...paging, search: 'oct' }, ctx);
    expect(listed.totalCount).toBe(1);

    const updated = await Mutation.updateNewsletterIssue(
      null,
      { id: created.id, input: { ...input, title: 'October recap' } },
      ctx,
    );
    expect(updated).toMatchObject({ id: created.id, title: 'October recap' });

    await expect(Mutation.deleteNewsletterIssue(null, { id: created.id }, ctx)).resolves.toBe(true);
    await expect(Query.newsletterIssues(null, paging, ctx)).resolves.toMatchObject({
      totalCount: 0,
    });
  });

  it('refuses somebody who is not signed in', async () => {
    await expect(Query.newsletterIssues(null, paging, { user: null })).rejects.toThrow(
      'Authentication required',
    );
    await expect(Mutation.createNewsletterIssue(null, { input }, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('newsletter subscribers for the website team', () => {
  it('adds a subscriber from the portal, changes the status and deletes them', async () => {
    const ctx = editorCtx();

    await expect(
      Mutation.addNewsletterSubscriber(null, { siteId: SITE, email: 'a@b.test', name: null }, ctx),
    ).resolves.toBe(true);
    const row = await NewsletterSubscriberModel.findOne().lean();
    expect(row).toMatchObject({ name: '', source: 'portal', status: 'SUBSCRIBED' });
    const id = String(row?._id);

    const listed = await Query.newsletterSubscribers(null, paging, ctx);
    expect(listed.totalCount).toBe(1);

    const updated = await Mutation.setNewsletterSubscriberStatus(
      null,
      { id, status: 'UNSUBSCRIBED' },
      ctx,
    );
    expect(updated).toMatchObject({ id, status: 'UNSUBSCRIBED' });

    await expect(Mutation.deleteNewsletterSubscriber(null, { id }, ctx)).resolves.toBe(true);
    await expect(NewsletterSubscriberModel.countDocuments()).resolves.toBe(0);
  });

  it('keeps the name given by the team', async () => {
    await Mutation.addNewsletterSubscriber(
      null,
      { siteId: SITE, email: 'a@b.test', name: 'Ann' },
      editorCtx(),
    );

    await expect(NewsletterSubscriberModel.findOne().lean()).resolves.toMatchObject({
      name: 'Ann',
    });
  });
});
