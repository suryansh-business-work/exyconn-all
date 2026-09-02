import type {
  ListCampaignsQuery,
  CampaignChannel,
  CampaignStatus,
} from '@exyconn/shell/graphql/generated';

export type CampaignRow = ListCampaignsQuery['listCampaigns'][number];

export interface CampaignFormValues {
  name: string;
  channel: CampaignChannel;
  budget: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  subject: string;
  body: string;
}
