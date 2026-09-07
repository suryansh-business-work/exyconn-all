import { CampaignModel } from './marketing.model';
import { AudienceListModel } from './audience.model';
import { MarketingSuppressionModel } from './suppression.model';
import { marketingTypeDefs } from './marketing.typeDefs';
import { marketingCustomResolvers } from './marketing.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface CampaignInput {
  name: string;
  channel: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  status: string;
  subject?: string;
  body?: string;
  templateKey?: string;
  scheduledAt?: Date | null;
  scheduledAudienceListId?: string;
}

interface AudienceListInput {
  name: string;
  description?: string;
  clientIds?: string[];
  contactIds?: string[];
  dynamicSegment?: string;
  segmentValue?: string;
}

interface MarketingSuppressionInput {
  email: string;
  reason: string;
  source?: string;
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
    filterFields: ['name', 'channel', 'status'],
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
  stats: { countBy: ['status', 'channel', 'lastSentAt'], sum: ['budget'] },
});

export const audienceListsService = createCrudService<AudienceListInput>(
  AudienceListModel as never,
  'AudienceList',
);
const audienceResolvers = createCrudResolvers(audienceListsService, {
  name: 'AudienceList',
  roles: [ROLES.MARKETING],
  table: {
    searchFields: ['name', 'description'],
    filterFields: ['name', 'description'],
    sortFields: ['name', 'createdAt'],
    defaultSort: { field: 'name', dir: 'ASC' },
  },
});

export const marketingSuppressionsService = createCrudService<MarketingSuppressionInput>(
  MarketingSuppressionModel as never,
  'MarketingSuppression',
);
const suppressionResolvers = createCrudResolvers(marketingSuppressionsService, {
  name: 'MarketingSuppression',
  roles: [ROLES.MARKETING],
  table: {
    searchFields: ['email', 'source'],
    filterFields: ['email', 'reason', 'source'],
    sortFields: ['email', 'reason', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['reason'] },
});

/** Merges campaign CRUD, audience-list CRUD, suppression CRUD and the send that ties them together. */
export const marketingResolvers = {
  AudienceList: marketingCustomResolvers.AudienceList,
  Query: {
    ...campaignResolvers.Query,
    ...audienceResolvers.Query,
    ...suppressionResolvers.Query,
    ...marketingCustomResolvers.Query,
  },
  Mutation: {
    ...campaignResolvers.Mutation,
    ...audienceResolvers.Mutation,
    ...suppressionResolvers.Mutation,
    ...marketingCustomResolvers.Mutation,
  },
};

export { marketingTypeDefs };
export { startCampaignSchedule } from './marketing.schedule';
