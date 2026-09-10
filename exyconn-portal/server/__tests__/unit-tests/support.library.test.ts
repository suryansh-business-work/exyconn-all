import { KbArticleModel } from '../../src/modules/support/kb-article.model';
import { CannedReplyModel } from '../../src/modules/support/canned-reply.model';
import { supportLibraryResolvers } from '../../src/modules/support';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;
const search = supportLibraryResolvers.Query.searchKnowledgeBase as unknown as Resolver;
const activeCanned = supportLibraryResolvers.Query.listActiveCannedReplies as unknown as Resolver;
const createArticle = supportLibraryResolvers.Mutation.createKbArticle as unknown as Resolver;

interface Article {
  id: string;
  title: string;
  slug: string;
  updatedByName: string;
}

const ctx = (roles: string[] = [ROLES.SUPPORT]) =>
  ({ user: { id: '65b000000000000000000001', email: 'agent@exyconn.com', roles } }) as unknown as GraphQLContext;

const article = (over: Record<string, unknown> = {}) =>
  KbArticleModel.create({
    title: 'Reset your VPN password',
    slug: 'reset-vpn-password',
    category: 'IT',
    summary: 'What to do when the VPN rejects your credentials',
    body: 'Open the portal, choose Security, then Reset VPN credentials.',
    isPublished: true,
    ...over,
  });

const snippet = (over: Record<string, unknown> = {}) =>
  CannedReplyModel.create({
    title: 'Ask for a screenshot',
    category: 'IT',
    body: 'Could you send a screenshot of the error?',
    isActive: true,
    ...over,
  });

describe('the knowledge base', () => {
  it('finds a published article by a word in its title', async () => {
    await article();

    const rows = (await search(null, { query: 'VPN' }, ctx())) as unknown as Article[];

    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('reset-vpn-password');
  });

  it('never returns a draft, however well it matches', async () => {
    await article({ isPublished: false });

    const rows = (await search(null, { query: 'VPN' }, ctx())) as unknown as Article[];

    expect(rows).toHaveLength(0);
  });

  it('is open to any signed-in user, not just the support team', async () => {
    await article();

    const rows = (await search(
      null,
      { query: 'VPN' },
      ctx([ROLES.EMPLOYEE]),
    )) as unknown as Article[];

    expect(rows).toHaveLength(1);
  });

  it('refuses a search too short to mean anything', async () => {
    await expect(search(null, { query: 'a' }, ctx())).rejects.toThrow(/at least two characters/i);
  });

  it('ranks a title match above a body-only match', async () => {
    await article();
    await article({
      title: 'Joining a client call',
      slug: 'joining-a-client-call',
      summary: 'Dial-in details',
      body: 'If you are off site you will need the VPN first.',
    });

    const rows = (await search(null, { query: 'VPN' }, ctx())) as unknown as Article[];

    expect(rows.map((row) => row.slug)).toEqual(['reset-vpn-password', 'joining-a-client-call']);
  });

  it('refuses a second article on the same slug', async () => {
    await article();

    await expect(article({ title: 'Something else' })).rejects.toThrow();
  });

  it('stamps who wrote it, so the thread reads without a join years later', async () => {
    await createArticle(
      null,
      {
        input: {
          title: 'Printer setup',
          slug: 'printer-setup',
          category: 'IT',
          body: 'Add the printer from Settings.',
          isPublished: true,
        },
      },
      ctx(),
    );

    const saved = await KbArticleModel.findOne({ slug: 'printer-setup' }).lean();
    expect(saved?.updatedByName).toBe('agent@exyconn.com');
  });
});

describe('canned replies', () => {
  it('offers the active snippets to the composer', async () => {
    await snippet();

    const rows = (await activeCanned(null, {}, ctx())) as unknown as Article[];

    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Ask for a screenshot');
  });

  it('leaves a retired snippet out of the composer', async () => {
    await snippet({ isActive: false });

    const rows = (await activeCanned(null, {}, ctx())) as unknown as Article[];

    expect(rows).toHaveLength(0);
  });

  it('is closed to somebody outside the support team', async () => {
    await expect(activeCanned(null, {}, ctx([ROLES.EMPLOYEE]))).rejects.toThrow();
  });
});
