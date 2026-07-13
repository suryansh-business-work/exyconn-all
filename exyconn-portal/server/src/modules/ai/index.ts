import { AiJobModel } from './ai.model';
import { PromptModel } from './prompt.model';
import { aiTypeDefs } from './ai.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface AiJobInput {
  name: string;
  model: string;
  prompt: string;
  status: string;
}

interface PromptInput {
  title: string;
  category: string;
  content: string;
  description?: string;
  tags?: string[];
}

export const aiService = createCrudService<AiJobInput>(AiJobModel as never, 'AiJob');
const aiJobResolvers = createCrudResolvers(aiService, { name: 'AiJob', roles: [ROLES.AI] });

export const promptService = createCrudService<PromptInput>(PromptModel as never, 'Prompt');
const promptResolvers = createCrudResolvers(promptService, { name: 'Prompt', roles: [ROLES.AI] });

/** Merges AI-job CRUD with the Prompt Library CRUD. */
export const aiResolvers = {
  Query: { ...aiJobResolvers.Query, ...promptResolvers.Query },
  Mutation: { ...aiJobResolvers.Mutation, ...promptResolvers.Mutation },
};

export { aiTypeDefs };
