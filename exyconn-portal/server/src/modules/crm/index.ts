import { LeadModel } from './crm.model';
import { withCampaignName, type LeadAttribution } from './crm.attribution';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { emitWebhookBestEffort } from '../integrations';
import { sanitizeCustom } from './records';
// Imported for its side effect: the module registers what it wants chased.
import './crm.reminders';
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
  custom?: unknown;
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

/** The form's input, with the campaign's name resolved and the custom values checked. */
const completeLead = async (input: LeadInput): Promise<LeadInput> => ({
  ...(await withCampaignName(input)),
  custom: await sanitizeCustom('LEAD', input.custom),
});

/** The form's save. */
const createLead = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: LeadInput };
  const completed = { input: await completeLead(input) } as unknown as never;
  const lead = (await leads.Mutation.createLead(p, completed, ctx)) as LeadInput & { id: string };
  emitWebhookBestEffort('lead.created', {
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    source: lead.source,
    stage: lead.stage,
    value: lead.value,
    owner: lead.owner,
    campaignId: lead.campaignId,
    campaignName: lead.campaignName,
  });
  return lead;
};

const updateLead = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: LeadInput };
  const completed = { id, input: await completeLead(input) } as unknown as never;
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

export { crmTypeDefs } from './crm.typeDefs';
export { crmEntitiesTypeDefs } from './crm.entities.typeDefs';
export { crmProfileTypeDefs } from './crm.profile.typeDefs';
export { crmRecordsTypeDefs, crmRecordsResolvers } from './records';
export {
  crmEntitiesResolvers,
  companiesService,
  contactsService,
  dealsService,
  activitiesService,
} from './crm.entities';
