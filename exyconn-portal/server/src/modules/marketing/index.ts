import { CampaignModel } from './marketing.model';
import { AudienceListModel } from './audience.model';
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
}

interface AudienceListInput {
  name: string;
  description?: string;
  clientIds?: string[];
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
  stats: { countBy: ['status', 'lastSentAt'], sum: ['budget'] },
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

/** Merges campaign CRUD, audience-list CRUD and the send that ties the two together. */
export const marketingResolvers = {
  Query: {
    ...campaignResolvers.Query,
    ...audienceResolvers.Query,
    ...marketingCustomResolvers.Query,
  },
  Mutation: {
    ...campaignResolvers.Mutation,
    ...audienceResolvers.Mutation,
    ...marketingCustomResolvers.Mutation,
  },
};

export { marketingTypeDefs };
