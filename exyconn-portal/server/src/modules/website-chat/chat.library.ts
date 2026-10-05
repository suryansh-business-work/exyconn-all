import { ROLES } from '../../constants/roles';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { createCrudService } from '../../lib/crudService';
import { restrictToPlatform } from '../../lib/platformAccess';
import { ChatFaqModel, ChatKnowledgeModel } from './models';
import { announceWidgetConfig } from './chat.settings';
import { forgetKnowledgeCache } from './chat.retrieve';
import type { GraphQLContext } from '../../middleware/auth';

interface FaqInput {
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

interface KnowledgeInput {
  title: string;
  url?: string | null;
  content: string;
  isActive: boolean;
  source?: 'CUSTOM';
}

const faqService = createCrudService<FaqInput>(ChatFaqModel as never, 'FAQ');
const knowledgeService = createCrudService<KnowledgeInput>(
  ChatKnowledgeModel as never,
  'Knowledge',
);

const faqs = createCrudResolvers(faqService, {
  name: 'WebsiteChatFaq',
  roles: [ROLES.WEBSITE],
  table: {
    searchFields: ['question', 'answer'],
    filterFields: ['isActive'],
    sortFields: ['question', 'sortOrder', 'isActive', 'updatedAt'],
    defaultSort: { field: 'sortOrder', dir: 'ASC' },
  },
  labelFields: ['question'],
});

const knowledge = createCrudResolvers(knowledgeService, {
  name: 'WebsiteChatKnowledge',
  plural: 'WebsiteChatKnowledgeEntries',
  roles: [ROLES.WEBSITE],
  table: {
    searchFields: ['title', 'url', 'content'],
    filterFields: ['source', 'isActive'],
    sortFields: ['title', 'source', 'isActive', 'updatedAt'],
    defaultSort: { field: 'updatedAt', dir: 'DESC' },
  },
  stats: { countBy: ['source', 'isActive'] },
});

type Resolver = (parent: never, args: never, ctx: GraphQLContext) => unknown;

/** Runs `after` once a write succeeded: open widgets and the bot see the change at once. */
function thenRefresh<T extends Record<string, Resolver>>(resolvers: T, after: () => unknown): T {
  const wrapped: Record<string, Resolver> = {};
  for (const [name, resolve] of Object.entries(resolvers)) {
    wrapped[name] = async (parent, args, ctx) => {
      const result = await resolve(parent, args, ctx);
      await after();
      return result;
    };
  }
  return wrapped as T;
}

/** Knowledge written in the portal is always the team's own; only a sync files WEBSITE rows. */
function asCustom<T extends Record<string, Resolver>>(resolvers: T): T {
  const create = resolvers.createWebsiteChatKnowledge;
  return {
    ...resolvers,
    createWebsiteChatKnowledge: (
      parent: never,
      { input }: { input: KnowledgeInput },
      ctx: GraphQLContext,
    ) => create(parent, { input: { ...input, source: 'CUSTOM' } } as never, ctx),
  };
}

/** FAQs and knowledge: the generated CRUD, confined to the platform operator. */
export const websiteChatLibraryResolvers = {
  Query: { ...restrictToPlatform(faqs.Query), ...restrictToPlatform(knowledge.Query) },
  Mutation: {
    ...thenRefresh(restrictToPlatform(faqs.Mutation), announceWidgetConfig),
    ...thenRefresh(asCustom(restrictToPlatform(knowledge.Mutation)), forgetKnowledgeCache),
  },
};
