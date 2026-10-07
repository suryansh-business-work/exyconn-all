import { syncWebsiteKnowledge } from '../../../../src/modules/website-chat/chat.knowledge';
import { ChatKnowledgeModel, ChatSettingsModel } from '../../../../src/modules/website-chat/models';
import { BlogPostModel } from '../../../../src/modules/website/models/blog.model';
import { CaseStudyModel } from '../../../../src/modules/website/models/case-study.model';
import { env } from '../../../../src/config/env';
import { safeFetch } from '../../../../src/utils/safeFetch';
import { logger } from '../../../../src/utils/logger';
import { codeOf } from '../codeOf';

jest.mock('../../../../src/utils/safeFetch', () => ({ safeFetch: jest.fn() }));

const fetchMock = safeFetch as jest.Mock;
const site = `${env.websiteUrl}/${env.chatKnowledgeMarket}`;
const sitemapUrl = `${env.websiteUrl}/sitemap.xml`;

const answer = (status: number, body = '') => ({
  ok: status < 400,
  status,
  text: async () => body,
});

const sitemap = (urls: string[]) =>
  `<urlset>${urls.map((url) => `<url><loc> ${url} </loc></url>`).join('')}</urlset>`;

/** Serves each URL from the table; anything else was never meant to be fetched. */
function serve(routes: Record<string, () => unknown>) {
  fetchMock.mockImplementation(async (url: string) => {
    const route = routes[url];
    if (!route) {
      throw new Error(`Unexpected fetch of ${url}`);
    }
    return route();
  });
}

const titles = async (source: string) =>
  (await ChatKnowledgeModel.find({ source }).lean())
    .map((row) => row.title)
    .sort((a, b) => a.localeCompare(b));

beforeEach(async () => {
  await ChatSettingsModel.create({ knowledgeSyncError: 'old failure' });
});
afterEach(() => jest.restoreAllMocks());

describe('syncWebsiteKnowledge', () => {
  it("replaces the website's rows with its pages and articles, keeping the team's own", async () => {
    await ChatKnowledgeModel.create([
      { title: 'Old page', content: 'stale', source: 'WEBSITE' },
      { title: 'Mine', content: 'written by hand', source: 'CUSTOM' },
    ]);
    await BlogPostModel.create([
      { slug: 'ai-agents', title: 'AI agents', summary: 'Summary', content: '<p>Body</p>' },
      { slug: 'draft', title: 'Draft', content: '<p>Hidden</p>', isActive: false },
    ]);
    await CaseStudyModel.create({
      slug: 'acme',
      title: 'Acme',
      excerpt: 'Excerpt',
      content: '<p>Result</p>',
    });
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    serve({
      [sitemapUrl]: () =>
        answer(
          200,
          sitemap([
            site,
            `${site}/pricing`,
            `${site}/pricing`,
            `${site}/broken`,
            `${site}/offline`,
            `${site}/empty`,
            `${site}/long`,
            `${env.websiteUrl}/fr-fr/prix`,
            `${site}x/other`,
          ]),
        ),
      [site]: () => answer(200, '<title>Home</title><p>Welcome to Exyconn.</p>'),
      [`${site}/pricing`]: () => answer(200, '<p>Plans start at $10.</p>'),
      [`${site}/broken`]: () => answer(500),
      [`${site}/offline`]: () => {
        throw new Error('ECONNRESET');
      },
      [`${site}/empty`]: () => answer(200, '<nav>Only a menu</nav>'),
      [`${site}/long`]: () => answer(200, `<title>Long</title><p>${'word '.repeat(400)}</p>`),
    });

    const result = await syncWebsiteKnowledge();

    expect(result.count).toBe(6);
    expect(result.syncedAt).toBeInstanceOf(Date);
    expect(await titles('WEBSITE')).toEqual(
      ['AI agents', 'Acme', 'Home', 'Long (part 1)', 'Long (part 2)', `${site}/pricing`].sort(
        (a, b) => a.localeCompare(b),
      ),
    );
    expect(await titles('CUSTOM')).toEqual(['Mine']);
    expect(await ChatKnowledgeModel.findOne({ title: 'AI agents' }).lean()).toMatchObject({
      url: `${site}/blog/ai-agents`,
      content: 'Summary Body',
    });
    expect(await ChatKnowledgeModel.findOne({ title: 'Acme' }).lean()).toMatchObject({
      url: `${site}/case-studies/acme`,
      content: 'Excerpt Result',
    });
    expect(await ChatSettingsModel.findOne().lean()).toMatchObject({
      knowledgeSyncCount: 6,
      knowledgeSyncError: '',
      knowledgeSyncedAt: result.syncedAt,
    });
    expect(warned).toHaveBeenCalledWith(`Website chat sync skipped ${site}/broken (500)`);
    expect(warned).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      `Website chat sync skipped ${site}/offline`,
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      `${env.websiteUrl}/fr-fr/prix`,
      {},
      expect.anything(),
    );
    expect(fetchMock.mock.calls.filter(([url]) => url === `${site}/pricing`)).toHaveLength(1);
  });

  it('records why the sitemap could not be read and keeps the previous rows', async () => {
    await ChatKnowledgeModel.create({ title: 'Old page', content: 'stale', source: 'WEBSITE' });
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    serve({ [sitemapUrl]: () => answer(503) });

    expect(await codeOf(syncWebsiteKnowledge())).toBe('BAD_USER_INPUT');
    expect((await ChatSettingsModel.findOne().lean())?.knowledgeSyncError).toBe(
      'The sitemap answered 503',
    );
    expect(await titles('WEBSITE')).toEqual(['Old page']);
  });

  it('records an unknown error when the failure is not an Error', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    fetchMock.mockRejectedValue('socket hang up');
    await expect(syncWebsiteKnowledge()).rejects.toThrow(
      'Could not read the website just now. Try again in a few minutes.',
    );
    expect((await ChatSettingsModel.findOne().lean())?.knowledgeSyncError).toBe('unknown error');
  });
});
