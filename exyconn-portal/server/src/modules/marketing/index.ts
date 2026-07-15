import { CampaignModel } from './marketing.model';
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
    sortFields: ['name', 'channel', 'budget', 'status', 'startDate', 'endDate', 'lastSentAt', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
});

/** Merges campaign CRUD with the custom sendCampaign mutation. */
export const marketingResolvers = {
  Query: { ...campaignResolvers.Query },
  Mutation: { ...campaignResolvers.Mutation, ...marketingCustomResolvers.Mutation },
};

export { marketingTypeDefs };
