import { CampaignModel } from './marketing.model';
import { AudienceListModel } from './audience.model';
import { MarketingSuppressionModel } from './suppression.model';
import { marketingCustomResolvers } from './marketing.resolvers';
import { audienceResolvers, type AudienceCrud } from './audience.resolvers';
import { suppressionResolvers } from './suppression.resolvers';
import { SUPPRESSION_TABLE } from './suppression.service';
import { campaignStudioResolvers } from './campaign.studio.resolvers';
import { campaignLibraryResolvers } from './campaign-library.resolvers';
import { PreferenceCategoryModel } from './preference.model';
import { PERMISSION_MODULES } from '../../lib/permissions';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface CampaignInput {
  name: string;
  channel: string;
  budget: number;
  budgetCurrency: string;
  startDate: Date;
  endDate: Date;
  status: string;
  subject?: string;
  body?: string;
  templateKey?: string;
  scheduledAt?: Date | null;
  scheduledAudienceListId?: string;
}

interface MarketingSuppressionInput {
  email: string;
  reason: string;
}

export const marketingService = createCrudService<CampaignInput>(
  CampaignModel as never,
  'Campaign',
);
const campaignResolvers = createCrudResolvers(marketingService, {
  name: 'Campaign',
  roles: [ROLES.MARKETING],
  table: {
    searchFields: ['name', 'subject', 'body'],
    filterFields: ['name', 'channel', 'status', 'budgetCurrency'],
    sortFields: [
      'name',
      'channel',
      'budget',
      'status',
      'startDate',
      'endDate',
      'lastSentAt',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  // Budgets are summed across currencies, so the currency count says whether that sum is one.
  stats: { countBy: ['status', 'channel', 'lastSentAt', 'budgetCurrency'], sum: ['budget'] },
});

export const audienceListsService = createCrudService<object>(
  AudienceListModel as never,
  'AudienceList',
);
const audienceCrud = createCrudResolvers(audienceListsService, {
  name: 'AudienceList',
  roles: [ROLES.MARKETING],
  table: {
    searchFields: ['name', 'description'],
    filterFields: ['name', 'description', 'recipientSource', 'updateMode'],
    sortFields: ['name', 'recipientSource', 'updateMode', 'createdAt'],
    defaultSort: { field: 'name', dir: 'ASC' },
  },
});
// Saves go through the builder, which validates through these and then freezes fixed audiences.
const audiences = audienceResolvers(audienceCrud.Mutation as unknown as AudienceCrud);

export const marketingSuppressionsService = createCrudService<MarketingSuppressionInput>(
  MarketingSuppressionModel as never,
  'MarketingSuppression',
);
// The generated list/get/stats and the archive bulk action; every write is the custom one.
const suppressionCrud = createCrudResolvers(marketingSuppressionsService, {
  name: 'MarketingSuppression',
  roles: [ROLES.MARKETING],
  table: SUPPRESSION_TABLE,
  stats: { countBy: ['reason', 'origin'] },
});

interface PreferenceCategoryInput {
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
}

export const preferenceCategoriesService = createCrudService<PreferenceCategoryInput>(
  PreferenceCategoryModel as never,
  'PreferenceCategory',
);
const preferenceCategoryCrud = createCrudResolvers(preferenceCategoriesService, {
  name: 'PreferenceCategory',
  plural: 'PreferenceCategories',
  roles: [ROLES.MARKETING],
  table: {
    searchFields: ['name', 'description'],
    filterFields: ['name', 'isActive'],
    sortFields: ['name', 'sortOrder', 'createdAt'],
    defaultSort: { field: 'sortOrder', dir: 'ASC' },
  },
});
// Studio-only modules an administrator can restrict in the role permission matrix.
PERMISSION_MODULES.add('CampaignTemplate');
PERMISSION_MODULES.add('MarketingFooter');

/** Merges campaign CRUD, the audience builder, the suppression list, the studio and the send. */
export const marketingResolvers = {
  AudienceResolution: audiences.AudienceResolution,
  Query: {
    ...campaignResolvers.Query,
    ...audienceCrud.Query,
    ...audiences.Query,
    ...suppressionCrud.Query,
    ...suppressionResolvers.Query,
    ...preferenceCategoryCrud.Query,
    ...campaignStudioResolvers.Query,
    ...campaignLibraryResolvers.Query,
    ...marketingCustomResolvers.Query,
  },
  Mutation: {
    ...campaignResolvers.Mutation,
    ...audiences.Mutation,
    ...suppressionResolvers.Mutation,
    ...preferenceCategoryCrud.Mutation,
    ...campaignStudioResolvers.Mutation,
    ...campaignLibraryResolvers.Mutation,
    ...marketingCustomResolvers.Mutation,
  },
};

export { marketingTypeDefs } from './marketing.typeDefs';
export { audienceTypeDefs } from './audience.typeDefs';
export { suppressionTypeDefs } from './suppression.typeDefs';
export { campaignStudioTypeDefs } from './campaign.studio.typeDefs';
export { startCampaignSchedule } from './marketing.schedule';
export { marketingMetricsTypeDefs } from './marketing.metrics.typeDefs';
export { marketingMetricsResolvers, campaignMetricsFor } from './marketing.metrics';
