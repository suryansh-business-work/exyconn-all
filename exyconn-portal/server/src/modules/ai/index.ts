import { AiJobModel } from './ai.model';
import { PromptModel } from './prompt.model';
import { aiTypeDefs } from './ai.typeDefs';
import { aiCustomResolvers } from './ai.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface AiJobInput {
  name: string;
  model: string;
  prompt: string;
}

interface PromptInput {
  title: string;
  category: string;
  content: string;
  description?: string;
  tags?: string[];
}

export const aiService = createCrudService<AiJobInput>(AiJobModel as never, 'AiJob');
const aiJobResolvers = createCrudResolvers(aiService, {
  name: 'AiJob',
  roles: [ROLES.AI],
  table: {
    searchFields: ['name', 'model', 'prompt'],
    filterFields: ['name', 'model', 'prompt', 'status'],
    sortFields: ['name', 'model', 'status', 'totalTokens', 'ranAt', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'model'], sum: ['totalTokens'] },
});

export const promptService = createCrudService<PromptInput>(PromptModel as never, 'Prompt');
const promptResolvers = createCrudResolvers(promptService, {
  name: 'Prompt',
  roles: [ROLES.AI],
  table: {
    searchFields: ['title', 'content', 'description'],
    filterFields: ['title', 'content', 'description', 'category'],
    sortFields: ['title', 'category', 'content', 'description', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['category'] },
});

/** Merges AI-job CRUD, the Prompt Library CRUD and the resolvers that call OpenAI. */
export const aiResolvers = {
  Query: { ...aiJobResolvers.Query, ...promptResolvers.Query, ...aiCustomResolvers.Query },
  Mutation: {
    ...aiJobResolvers.Mutation,
    ...promptResolvers.Mutation,
    ...aiCustomResolvers.Mutation,
  },
};

export { aiTypeDefs };
