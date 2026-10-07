import { Types } from 'mongoose';
import { newsletter } from '../../../../src/modules/cms/cms.newsletter';
import { NewsletterSubscriberModel } from '../../../../src/modules/cms/models';

const SITE = 'site-1';
const missingId = () => String(new Types.ObjectId());

interface SubscriberRow {
  id: string;
  email: string;
}

const emailsOf = (page: { rows: unknown[] }) =>
  (page.rows as SubscriberRow[]).map((row) => row.email);

const subscriber = (email: string) => NewsletterSubscriberModel.findOne({ email }).lean();

describe('newsletter.subscribe', () => {
  it('signs a reader up with consent, a source and an unsubscribe token', async () => {
    const source = `/blog/${'x'.repeat(400)}`;

    await expect(
      newsletter.subscribe(SITE, ' Reader@Example.TEST ', `  ${'n'.repeat(130)} `, source),
    ).resolves.toBe(true);

    const row = await subscriber('reader@example.test');
    expect(row).toMatchObject({
      siteId: SITE,
      status: 'SUBSCRIBED',
      name: 'n'.repeat(120),
      source: source.slice(0, 300),
      consentAt: expect.any(Date),
    });
    expect(row?.unsubscribeToken).toMatch(/^[a-f\d]{48}$/);
  });

  it('refuses an address that is not an email', async () => {
    await expect(newsletter.subscribe(SITE, 'not-an-email', '', 'portal')).rejects.toThrow(
      'Enter a valid email address.',
    );
  });

  it('keeps one row per site and address, subscribing an unsubscribed reader again', async () => {
    await newsletter.subscribe(SITE, 'reader@example.test', 'Reader', '/home');
    const first = await subscriber('reader@example.test');
    await newsletter.unsubscribeByToken(first?.unsubscribeToken ?? '');

    await newsletter.subscribe(SITE, 'reader@example.test', 'Reader Two', '/again');

    const rows = await NewsletterSubscriberModel.find({ siteId: SITE }).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: 'SUBSCRIBED',
      name: 'Reader Two',
      source: '/home',
      unsubscribeToken: first?.unsubscribeToken,
    });
  });

  it('keeps the same address separately on another site', async () => {
    await newsletter.subscribe(SITE, 'reader@example.test', '', 'portal');
    await newsletter.subscribe('site-2', 'reader@example.test', '', 'portal');

    await expect(NewsletterSubscriberModel.countDocuments()).resolves.toBe(2);
  });
});

describe('unsubscribing and managing subscribers', () => {
  it('unsubscribes by token, and reports an unknown token', async () => {
    await newsletter.subscribe(SITE, 'reader@example.test', '', 'portal');
    const row = await subscriber('reader@example.test');

    await expect(newsletter.unsubscribeByToken(row?.unsubscribeToken ?? '')).resolves.toBe(true);
    await expect(newsletter.unsubscribeByToken('unknown-token')).resolves.toBe(false);
    await expect(subscriber('reader@example.test')).resolves.toMatchObject({
      status: 'UNSUBSCRIBED',
    });
  });

  it('sets a status and removes a subscriber', async () => {
    await newsletter.subscribe(SITE, 'reader@example.test', '', 'portal');
    const id = String((await subscriber('reader@example.test'))?._id);

    await expect(newsletter.setSubscriberStatus(id, 'UNSUBSCRIBED')).resolves.toMatchObject({
      status: 'UNSUBSCRIBED',
    });
    await expect(newsletter.removeSubscriber(id)).resolves.toBe(true);
    await expect(NewsletterSubscriberModel.countDocuments()).resolves.toBe(0);
  });

  it('says when the subscriber does not exist', async () => {
    await expect(newsletter.setSubscriberStatus(missingId(), 'SUBSCRIBED')).rejects.toThrow(
      'Subscriber not found',
    );
    await expect(newsletter.removeSubscriber(missingId())).rejects.toThrow('Subscriber not found');
  });
});

describe('newsletter.subscribers', () => {
  const seed = () =>
    NewsletterSubscriberModel.collection.insertMany([
      { siteId: SITE, email: 'a@x.test', name: 'Ann', createdAt: new Date(1000) },
      { siteId: SITE, email: 'b@x.test', name: 'Bob', createdAt: new Date(2000) },
      { siteId: SITE, email: 'c@x.test', name: 'Annika', createdAt: new Date(3000) },
      { siteId: 'site-2', email: 'd@x.test', name: 'Ann', createdAt: new Date(4000) },
    ]);

  it('pages a site subscribers newest first', async () => {
    await seed();

    const page = await newsletter.subscribers(SITE, 0, 2);

    expect(page.totalCount).toBe(3);
    expect(emailsOf(page)).toEqual(['c@x.test', 'b@x.test']);
    expect((page.rows as SubscriberRow[])[0].id).toEqual(expect.any(String));
  });

  it('searches the email and the name', async () => {
    await seed();

    const byName = await newsletter.subscribers(SITE, 0, 10, 'ann');
    const byEmail = await newsletter.subscribers(SITE, 0, 10, 'b@x');

    expect(emailsOf(byName)).toEqual(['c@x.test', 'a@x.test']);
    expect(emailsOf(byEmail)).toEqual(['b@x.test']);
  });
});
