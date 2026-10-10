import { Types } from 'mongoose';
import { KbArticleModel } from '../../../../src/modules/support/kb-article.model';
import { CannedReplyModel } from '../../../../src/modules/support/canned-reply.model';
import { supportLibraryResolvers } from '../../../../src/modules/support/support.library';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = supportLibraryResolvers.Mutation as unknown as Record<string, Resolver>;
const Q = supportLibraryResolvers.Query as unknown as Record<string, Resolver>;
const fields = supportLibraryResolvers.KbArticle;

const ctx = (roles: Role[], email = 'desk@exyconn.com'): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), email, roles },
});
const asIt = () => ctx([ROLES.IT]);
const asSupport = () => ctx([ROLES.SUPPORT]);

const article = (category: string) =>
  KbArticleModel.create({
    title: `${category} how-to`,
    slug: `${category.toLowerCase()}-how-to`,
    category,
    body: 'Steps.',
    isPublished: true,
  });

const edit = (category: string) => ({
  title: 'Reworded',
  slug: `${category.toLowerCase()}-how-to`,
  category,
  body: 'New steps.',
  isPublished: true,
});

describe('KbArticle fields', () => {
  it('reads unset text fields as empty and keeps set ones', () => {
    expect(fields.summary({})).toBe('');
    expect(fields.updatedById({ updatedById: null })).toBe('');
    expect(fields.updatedByName({})).toBe('');
    expect(fields.summary({ summary: 'One line' })).toBe('One line');
    expect(fields.updatedById({ updatedById: 'u1' })).toBe('u1');
    expect(fields.updatedByName({ updatedByName: 'Asha' })).toBe('Asha');
  });
});

describe('updateKbArticle', () => {
  it('lets IT edit an IT article and stamps the editor', async () => {
    const row = await article('IT');
    const itCtx = asIt();

    await M.updateKbArticle(null, { id: row._id.toHexString(), input: edit('IT') }, itCtx);

    const saved = await KbArticleModel.findById(row._id).lean();
    expect(saved).toMatchObject({ title: 'Reworded', updatedById: itCtx.user?.id });
  });

  it('stops IT editing an article filed under another team, whatever the edit says', async () => {
    const row = await article('HR');

    await expect(
      M.updateKbArticle(null, { id: row._id.toHexString(), input: edit('IT') }, asIt()),
    ).rejects.toThrow('IT category');
    expect((await KbArticleModel.findById(row._id).lean())?.title).toBe('HR how-to');
  });

  it('treats a missing article as out of IT’s reach', async () => {
    await expect(
      M.updateKbArticle(
        null,
        { id: new Types.ObjectId().toHexString(), input: edit('IT') },
        asIt(),
      ),
    ).rejects.toThrow('IT category');
  });

  it('lets the support desk move any article to any category', async () => {
    const row = await article('HR');

    await M.updateKbArticle(
      null,
      { id: row._id.toHexString(), input: edit('PAYROLL') },
      asSupport(),
    );

    expect((await KbArticleModel.findById(row._id).lean())?.category).toBe('PAYROLL');
  });

  it('stamps an empty editor name when the token carries no email', async () => {
    const row = await article('HR');
    const noEmail = { user: { id: 'u1', roles: [ROLES.SUPPORT] } } as unknown as GraphQLContext;

    await M.updateKbArticle(null, { id: row._id.toHexString(), input: edit('HR') }, noEmail);

    expect((await KbArticleModel.findById(row._id).lean())?.updatedByName).toBe('');
  });
});

describe('deleteKbArticle', () => {
  it('lets IT delete its own article but not another team’s', async () => {
    const mine = await article('IT');
    const theirs = await article('HR');

    await expect(M.deleteKbArticle(null, { id: mine._id.toHexString() }, asIt())).resolves.toBe(
      true,
    );
    await expect(M.deleteKbArticle(null, { id: theirs._id.toHexString() }, asIt())).rejects.toThrow(
      'IT category',
    );
    expect(await KbArticleModel.countDocuments()).toBe(1);
  });

  it('passes a malformed id straight to the not-found answer', async () => {
    await expect(M.deleteKbArticle(null, { id: 'nope' }, asIt())).rejects.toThrow();
  });
});

describe('listActiveCannedReplies', () => {
  it('gives IT only the IT snippets, sorted by title', async () => {
    await CannedReplyModel.create([
      { title: 'Reset VPN', category: 'IT', body: 'Steps.' },
      { title: 'Ask for a screenshot', category: 'IT', body: 'Please send one.' },
      { title: 'Payslip timing', category: 'PAYROLL', body: 'Slips land on the 1st.' },
    ]);

    const rows = (await Q.listActiveCannedReplies(null, {}, asIt())) as Array<{ title: string }>;

    expect(rows.map((row) => row.title)).toEqual(['Ask for a screenshot', 'Reset VPN']);
  });
});
