import { Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { useLeadsByCampaignQuery } from '@exyconn/shell/graphql/generated';

/**
 * How many leads this campaign is credited with.
 *
 * Budget and recipients say what a campaign cost and how far it went; this is the only
 * line on the drawer that says whether it worked.
 */
export function CampaignAttribution({ campaignId }: Readonly<{ campaignId: string }>) {
  const { data, loading } = useLeadsByCampaignQuery({ variables: { campaignId } });

  return (
    <DetailRow label="Leads generated">
      <Text size="sm">{loading ? '…' : (data?.leadsByCampaign ?? 0)}</Text>
    </DetailRow>
  );
}
