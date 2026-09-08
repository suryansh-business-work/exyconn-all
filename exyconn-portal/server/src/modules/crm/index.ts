import { LeadModel } from './crm.model';
import { crmTypeDefs } from './crm.typeDefs';
import { withCampaignName, type LeadAttribution } from './crm.attribution';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

interface LeadInput {
  name: string;
  email: string;
  source: string;
  stage: string;
  value: number;
  owner: string;
  notes?: string;
  campaignId?: string;
  campaignName?: string;
}

export const crmService = createCrudService<LeadInput>(LeadModel as never, 'Lead');
const leads = createCrudResolvers(crmService, {
  name: 'Lead',
  roles: [ROLES.CRM],
  table: {
    searchFields: ['name', 'email', 'owner'],
    filterFields: ['name', 'email', 'owner', 'source', 'stage'],
    sortFields: ['name', 'email', 'source', 'stage', 'value', 'owner', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['stage', 'source'], sum: ['value'] },
});

/** The form's save, with the campaign's name resolved from the id it picked. */
const createLead = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: LeadInput };
  const completed = { input: await withCampaignName(input) } as unknown as never;
  return leads.Mutation.createLead(p, completed, ctx);
};

const updateLead = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: LeadInput };
  const completed = { id, input: await withCampaignName(input) } as unknown as never;
  return leads.Mutation.updateLead(p, completed, ctx);
};

export const crmResolvers = {
  /** Written before attribution existed, a `.lean()` row comes back without these. */
  Lead: {
    campaignId: (lead: LeadAttribution) => lead.campaignId ?? '',
    campaignName: (lead: LeadAttribution) => lead.campaignName ?? '',
  },
  Query: leads.Query,
  Mutation: { ...leads.Mutation, createLead, updateLead },
};

export { crmTypeDefs };
export { crmEntitiesTypeDefs } from './crm.entities.typeDefs';
export {
  crmEntitiesResolvers,
  companiesService,
  contactsService,
  dealsService,
  activitiesService,
} from './crm.entities';
