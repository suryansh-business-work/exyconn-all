import { CompanyModel } from './company.model';
import { ContactModel } from './contact.model';
import { CLOSED_DEAL_STAGES, DealModel } from './deal.model';
import { ActivityModel } from './activity.model';
import { convertLead } from './crm.convert';
import { clientForDeal, promoteCompanyToClient } from './crm.promote';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

const crmRoles = [ROLES.CRM];

interface CompanyInput {
  name: string;
  domain: string;
  industry?: string;
  size: string;
  status: string;
  phone?: string;
  location?: string;
  owner: string;
  notes?: string;
}

interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  title?: string;
  companyId?: string;
  companyName?: string;
  status: string;
  owner: string;
  notes?: string;
}

interface DealInput {
  title: string;
  companyId?: string;
  companyName?: string;
  contactId?: string;
  contactName?: string;
  stage: string;
  value: number;
  probability: number;
  expectedCloseDate?: Date | null;
  owner: string;
  notes?: string;
}

interface ActivityInput {
  type: string;
  subject: string;
  notes?: string;
  relatedType: string;
  relatedId?: string;
  relatedName?: string;
  dueDate?: Date | null;
  done: boolean;
  owner: string;
}

export const companiesService = createCrudService<CompanyInput>(CompanyModel as never, 'Company');
export const contactsService = createCrudService<ContactInput>(ContactModel as never, 'Contact');
export const dealsService = createCrudService<DealInput>(DealModel as never, 'Deal');
export const activitiesService = createCrudService<ActivityInput>(
  ActivityModel as never,
  'Activity',
);

const companies = createCrudResolvers(companiesService, {
  name: 'Company',
  plural: 'Companies',
  roles: crmRoles,
  table: {
    searchFields: ['name', 'domain', 'industry', 'owner'],
    filterFields: ['name', 'domain', 'industry', 'size', 'status', 'owner', 'location'],
    sortFields: ['name', 'domain', 'industry', 'size', 'status', 'owner', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'size'] },
});

const contacts = createCrudResolvers(contactsService, {
  name: 'Contact',
  roles: crmRoles,
  table: {
    searchFields: ['name', 'email', 'companyName', 'title', 'owner'],
    filterFields: ['name', 'email', 'companyName', 'status', 'owner'],
    sortFields: ['name', 'email', 'companyName', 'status', 'owner', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});

const deals = createCrudResolvers(dealsService, {
  name: 'Deal',
  roles: crmRoles,
  table: {
    searchFields: ['title', 'companyName', 'contactName', 'owner'],
    filterFields: ['title', 'companyName', 'contactName', 'stage', 'owner'],
    sortFields: ['title', 'companyName', 'stage', 'value', 'owner', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['stage'], sum: ['value'] },
});

const activities = createCrudResolvers(activitiesService, {
  name: 'Activity',
  plural: 'Activities',
  roles: crmRoles,
  table: {
    searchFields: ['subject', 'relatedName', 'owner'],
    filterFields: ['subject', 'type', 'relatedType', 'relatedName', 'owner'],
    sortFields: ['subject', 'type', 'dueDate', 'owner', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['type', 'relatedType'] },
});

/**
 * Moving a card on the pipeline board. A dedicated mutation rather than a full
 * update, so a drag sends the one field that changed and cannot silently
 * overwrite an edit someone made in the form at the same time. Dropping a deal on
 * Won is the moment the account becomes a client.
 */
const setDealStage = async (
  _p: unknown,
  { id, stage }: { id: string; stage: string },
  ctx: GraphQLContext,
) => {
  assertRole(ctx, crmRoles);
  const deal = await DealModel.findById(id).lean();
  if (!deal) {
    notFound('Deal');
  }
  const clientId = stage === 'WON' ? await clientForDeal(deal) : (deal.clientId ?? '');
  const updated = await DealModel.findByIdAndUpdate(id, { stage, clientId }, { new: true }).lean();
  if (!updated) {
    notFound('Deal');
  }
  return withId(updated);
};

/** The form's save, with the same client hand-off a drag onto Won gets. */
const updateDeal = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: DealInput };
  if (input.stage !== 'WON') {
    return deals.Mutation.updateDeal(p, args, ctx);
  }
  const deal = await DealModel.findById(id).lean();
  if (!deal) {
    notFound('Deal');
  }
  const clientId = await clientForDeal({ ...deal, ...input });
  const completed = { id, input: { ...input, clientId } } as unknown as never;
  return deals.Mutation.updateDeal(p, completed, ctx);
};

/**
 * The open pipeline weighted by probability — the number a forecast is built on. One
 * aggregation, because the overview should not fetch every deal to add them up.
 */
const dealForecast = async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
  assertRole(ctx, crmRoles);
  const [row] = await DealModel.aggregate<{
    openCount: number;
    openValue: number;
    weightedValue: number;
  }>([
    { $match: { stage: { $nin: [...CLOSED_DEAL_STAGES] } } },
    {
      $group: {
        _id: null,
        openCount: { $sum: 1 },
        openValue: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } },
      },
    },
    { $project: { _id: 0 } },
  ]);
  return row ?? { openCount: 0, openValue: 0, weightedValue: 0 };
};

export const crmEntitiesResolvers = {
  /** Written before the field existed, a `.lean()` row comes back without it. */
  Company: {
    clientId: (company: { clientId?: string | null }) => company.clientId ?? '',
    isClient: (company: { clientId?: string | null }) => Boolean(company.clientId),
  },
  Deal: {
    clientId: (deal: { clientId?: string | null }) => deal.clientId ?? '',
  },
  Query: {
    dealForecast,
    ...companies.Query,
    ...contacts.Query,
    ...deals.Query,
    ...activities.Query,
  },
  Mutation: {
    ...companies.Mutation,
    ...contacts.Mutation,
    ...deals.Mutation,
    ...activities.Mutation,
    updateDeal,
    setDealStage,
    promoteCompanyToClient,
    convertLead,
  },
};
