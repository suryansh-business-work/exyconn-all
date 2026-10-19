import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Skeleton } from '@exyconn/shell/components/ui';
import { useGetCampaignQuery } from '@exyconn/shell/graphql/generated';
import { CampaignForm } from './forms/campaign';

/** Where the studio lives: `/marketing/campaigns/new` or `/marketing/campaigns/:id`. */
export const studioPath = (id: string | null, step?: string) =>
  `/marketing/campaigns/${id ?? 'new'}${step ? `?step=${step}` : ''}`;

/** The Email Campaign Studio page: a new campaign, or one loaded by its id. */
export function CampaignStudioPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId = 'new' } = useParams();
  const isNew = campaignId === 'new';
  const { data, loading, error } = useGetCampaignQuery({
    variables: { id: campaignId },
    skip: isNew,
    fetchPolicy: 'network-only',
  });
  const exit = () => navigate('/marketing/campaigns');
  let content = <CampaignForm initial={null} onExit={exit} />;
  if (!isNew && loading) {
    content = <Skeleton variant="rounded" height={480} aria-label={t('Loading the campaign…')} />;
  } else if (!isNew && error) {
    content = <Alert severity="error">{error.message}</Alert>;
  } else if (!isNew && data) {
    content = <CampaignForm key={data.getCampaign.id} initial={data.getCampaign} onExit={exit} />;
  }
  return <Box sx={{ p: { xs: 2, md: 3 } }}>{content}</Box>;
}
