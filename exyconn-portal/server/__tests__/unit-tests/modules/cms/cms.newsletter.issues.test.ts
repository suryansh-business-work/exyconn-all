import { Types } from 'mongoose';
import { newsletter, type NewsletterIssueInput } from '../../../../src/modules/cms/cms.newsletter';
import { freezeClock } from '../../../helpers';

const SITE = 'site-1';
const missingId = () => String(new Types.ObjectId());

const issue = (fields: Partial<NewsletterIssueInput> = {}): NewsletterIssueInput => ({
  siteId: SITE,
  slug: 'october-2026',
  title: 'October',
  content: '<p>News</p>',
  isActive: true,
  ...fields,
});

interface IssueRow {
  id: string;
  slug: string;
}

/** The rows of a page of issues (the service pages several models, so it returns them untyped). */
const slugsOf = (page: { rows: unknown[] }) => (page.rows as IssueRow[]).map((row) => row.slug);

afterEach(() => {
  jest.useRealTimers();
});

describe('newsletter issues', () => {
  it('creates an issue with a normalised address and trimmed text', async () => {
    const created = await newsletter.createIssue(
      issue({
        slug: ' October-2026 ',
        title: ' October ',
        summary: ' What changed ',
        coverImage: ' https://img.test/c.png ',
        contentCss: 'p{}',
        publishedAt: '2026-10-01T09:00:00.000Z',
      }),
    );

    expect(created).toMatchObject({
      siteId: SITE,
      slug: 'october-2026',
      title: 'October',
      summary: 'What changed',
      coverImage: 'https://img.test/c.png',
      content: '<p>News</p>',
      contentCss: 'p{}',
      isActive: true,
      publishedAt: new Date('2026-10-01T09:00:00.000Z'),
    });
  });

  it('dates an issue now when no publication date is given', async () => {
    freezeClock('2026-10-07T12:00:00.000Z');

    const created = await newsletter.createIssue(issue({ summary: null, coverImage: null }));

    expect(created).toMatchObject({
      publishedAt: new Date('2026-10-07T12:00:00.000Z'),
      summary: '',
      coverImage: '',
      contentCss: '',
    });
  });

  it.each(['a', '-start', 'end-', 'has space', 'Ünïcode'])(
    'refuses the address %p',
    async (slug) => {
      await expect(newsletter.createIssue(issue({ slug }))).rejects.toThrow(
        'Use lower-case letters, digits and dashes for the issue address.',
      );
    },
  );

  it('refuses an issue without a title', async () => {
    await expect(newsletter.createIssue(issue({ title: '  ' }))).rejects.toThrow(
      'Give the issue a title.',
    );
  });

  it('refuses an address another issue of the site uses, but not of another site', async () => {
    await newsletter.createIssue(issue());

    await expect(newsletter.createIssue(issue())).rejects.toThrow(
      'Another issue already uses this address.',
    );
    await expect(newsletter.createIssue(issue({ siteId: 'site-2' }))).resolves.toMatchObject({
      siteId: 'site-2',
    });
  });

  it('updates an issue, keeping its own address', async () => {
    const created = await newsletter.createIssue(issue());

    const updated = await newsletter.updateIssue(
      String(created._id),
      issue({ title: 'October (revised)', isActive: false }),
    );

    expect(updated).toMatchObject({ title: 'October (revised)', isActive: false });
  });

  it('refuses to move an issue onto another issue address', async () => {
    await newsletter.createIssue(issue());
    const other = await newsletter.createIssue(issue({ slug: 'september-2026' }));

    await expect(newsletter.updateIssue(String(other._id), issue())).rejects.toThrow(
      'Another issue already uses this address.',
    );
  });

  it('says when the issue does not exist', async () => {
    await expect(newsletter.updateIssue(missingId(), issue())).rejects.toThrow(
      'Newsletter issue not found',
    );
    await expect(newsletter.removeIssue(missingId())).rejects.toThrow('Newsletter issue not found');
  });

  it('removes an issue', async () => {
    const created = await newsletter.createIssue(issue());

    await expect(newsletter.removeIssue(String(created._id))).resolves.toBe(true);
    await expect(newsletter.issues(SITE, 0, 10)).resolves.toEqual({ rows: [], totalCount: 0 });
  });
});

describe('newsletter.issues', () => {
  const seed = async () => {
    await newsletter.createIssue(
      issue({ slug: 'one', title: 'Launch', publishedAt: '2026-01-01T00:00:00.000Z' }),
    );
    await newsletter.createIssue(
      issue({ slug: 'two', title: 'Roadmap', summary: 'launch recap', publishedAt: '2026-02-01' }),
    );
    await newsletter.createIssue(
      issue({ slug: 'three', title: 'Hiring', publishedAt: '2026-03-01T00:00:00.000Z' }),
    );
    await newsletter.createIssue(issue({ siteId: 'site-2', slug: 'elsewhere', title: 'Other' }));
  };

  it('pages a site issues newest first, with ids', async () => {
    await seed();

    const first = await newsletter.issues(SITE, 0, 2);
    const last = await newsletter.issues(SITE, 1, 2);

    expect(first.totalCount).toBe(3);
    expect(slugsOf(first)).toEqual(['three', 'two']);
    expect(slugsOf(last)).toEqual(['one']);
    expect((first.rows as IssueRow[])[0].id).toEqual(expect.any(String));
  });

  it('searches title, address and summary, and clamps the page', async () => {
    await seed();

    const found = await newsletter.issues(SITE, -1, 0, ' LAUNCH ');

    expect(found.totalCount).toBe(2);
    expect(slugsOf(found)).toEqual(['two']);
  });
});
