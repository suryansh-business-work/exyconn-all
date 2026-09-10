import { KbArticleModel } from './kb-article.model';
import { CannedReplyModel } from './canned-reply.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

const supportTeam = [ROLES.SUPPORT];

/** How many results a search hands back. Long enough to find it, short enough to scan. */
const SEARCH_LIMIT = 10;

interface KbArticleInput {
  title: string;
  slug: string;
  category: string;
  summary?: string;
  body: string;
  isPublished: boolean;
}

interface CannedReplyInput {
  title: string;
  category: string;
  body: string;
  isActive: boolean;
}

export const kbArticleService = createCrudService<KbArticleInput>(
  KbArticleModel as never,
  'KbArticle',
);

const articles = createCrudResolvers(kbArticleService, {
  name: 'KbArticle',
  roles: supportTeam,
  table: {
    searchFields: ['title', 'slug', 'summary'],
    filterFields: ['category', 'isPublished'],
    sortFields: ['title', 'category', 'isPublished', 'updatedAt', 'createdAt'],
    defaultSort: { field: 'updatedAt', dir: 'DESC' },
  },
  stats: { countBy: ['category', 'isPublished'] },
});

export const cannedReplyService = createCrudService<CannedReplyInput>(
  CannedReplyModel as never,
  'CannedReply',
);

const canned = createCrudResolvers(cannedReplyService, {
  name: 'CannedReply',
  plural: 'CannedReplies',
  roles: supportTeam,
  table: {
    searchFields: ['title', 'body'],
    filterFields: ['category', 'isActive'],
    sortFields: ['title', 'category', 'isActive', 'createdAt'],
    defaultSort: { field: 'title', dir: 'ASC' },
  },
  stats: { countBy: ['category', 'isActive'] },
});

/** Who wrote it last. Resolved once on write so an article reads without a join, years on. */
async function stampAuthor(ctx: GraphQLContext, input: KbArticleInput) {
  const user = assertRole(ctx, supportTeam);
  return { ...input, updatedById: user.id, updatedByName: ctx.user?.email ?? '' };
}

const createKbArticle = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: KbArticleInput };
  const stamped = { input: await stampAuthor(ctx, input) } as unknown as never;
  return articles.Mutation.createKbArticle(p, stamped, ctx);
};

const updateKbArticle = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: KbArticleInput };
  const stamped = { id, input: await stampAuthor(ctx, input) } as unknown as never;
  return articles.Mutation.updateKbArticle(p, stamped, ctx);
};

/**
 * Published articles matching a phrase, best match first.
 *
 * Open to any signed-in user rather than the support team, because the two things this
 * serves are the same search: an agent looking for the answer to paste, and an employee
 * looking for it themselves. Drafts are excluded from both — a half-written answer
 * reaching either of them is the failure this flag exists to prevent.
 */
async function searchKnowledgeBase(_p: unknown, { query }: { query: string }, ctx: GraphQLContext) {
  assertAuthenticated(ctx);
  const phrase = query.trim();
  if (phrase.length < 2) {
    badRequest('Search for at least two characters.');
  }
  // Mongoose builds the text index in the background when the model is first used, so a
  // search arriving early in a fresh deployment can beat it and fail with "text index
  // required". `init()` resolves once and is cached, so this waits exactly once per boot.
  await KbArticleModel.init();
  const rows = await KbArticleModel.find(
    { isPublished: true, $text: { $search: phrase } },
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(SEARCH_LIMIT)
    .lean();
  return withIds(rows);
}

/** The snippets the composer offers. Retired ones stay in the register but not in the list. */
async function listActiveCannedReplies(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  assertRole(ctx, supportTeam);
  const rows = await CannedReplyModel.find({ isActive: true }).sort({ title: 1 }).lean();
  return withIds(rows);
}

export const supportLibraryResolvers = {
  KbArticle: {
    summary: (row: { summary?: string | null }) => row.summary ?? '',
    updatedById: (row: { updatedById?: string | null }) => row.updatedById ?? '',
    updatedByName: (row: { updatedByName?: string | null }) => row.updatedByName ?? '',
  },
  Query: {
    ...articles.Query,
    ...canned.Query,
    searchKnowledgeBase,
    listActiveCannedReplies,
  },
  Mutation: {
    ...articles.Mutation,
    ...canned.Mutation,
    createKbArticle,
    updateKbArticle,
  },
};
