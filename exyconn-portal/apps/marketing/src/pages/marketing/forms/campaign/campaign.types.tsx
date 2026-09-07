import type {
  CampaignFieldsFragment,
  CampaignChannel,
  CampaignStatus,
} from '@exyconn/shell/graphql/generated';

export type CampaignRow = CampaignFieldsFragment;

export interface CampaignFormValues {
  name: string;
  channel: CampaignChannel;
  budget: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  subject: string;
  body: string;
  templateKey: string;
  scheduledAt: string;
  scheduledAudienceListId: string;
}
