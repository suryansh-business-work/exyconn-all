import StarIcon from '@mui/icons-material/Star';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Chip,
  Divider,
  Flex,
  Link,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useCompanyGoogleBusinessQuery } from '@exyconn/shell/graphql/generated';
import { DetailField, DetailList } from '../../../../records/detail';
import { GoogleReviews } from './GoogleReviews';

/** "OPERATIONAL" → "Operational"; Places' enums read as words. */
const words = (value: string) =>
  value
    .replace(/^PRICE_LEVEL_/, '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

/**
 * Company > Google Business: the listing the lead generator filed it from, read live from Google
 * (rating, reviews, opening hours, status) — never stored, as Google's terms ask.
 */
export function GoogleBusinessTab({ companyId }: Readonly<{ companyId: string }>) {
  const t = useT();
  const { data, loading, error, refetch } = useCompanyGoogleBusinessQuery({
    variables: { companyId },
  });
  const profile = data?.companyGoogleBusiness;
  const reload = () => {
    refetch().catch((reloadError: unknown) =>
      portalLogger.warn('crm: reloading the Google Business profile failed', reloadError),
    );
  };

  if (loading && !profile) {
    return <PanelSkeleton lines={8} />;
  }
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reload}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the Google Business profile.'))}
      </Alert>
    );
  }
  if (!profile) {
    return (
      <Alert severity="info">
        {t('This company was not added from Google Places, so it has no Google Business profile.')}
      </Alert>
    );
  }
  return (
    <Stack spacing={2}>
      <Flex direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
        <Text component="h2" size="lg" weight="bold">
          {profile.name}
        </Text>
        {profile.rating != null && (
          <Flex direction="row" spacing={0.5} alignItems="center">
            <StarIcon color="warning" fontSize="small" />
            <Text weight="semibold">{profile.rating.toFixed(1)}</Text>
            <Text size="sm" color="text.secondary">
              {t('({count} reviews)', { count: profile.ratingCount ?? 0 })}
            </Text>
          </Flex>
        )}
        {profile.businessStatus && <Chip size="small" label={t(words(profile.businessStatus))} />}
      </Flex>
      {profile.summary && <Text>{profile.summary}</Text>}
      <DetailList>
        <DetailField label="Category" empty="Not listed">
          {profile.category}
        </DetailField>
        <DetailField label="Price level" empty="Not listed">
          {profile.priceLevel && t(words(profile.priceLevel))}
        </DetailField>
        <DetailField label="Phone" empty="Not listed">
          {profile.phone}
        </DetailField>
        <DetailField label="Website" empty="Not listed">
          {profile.website && (
            <Link href={profile.website} target="_blank" rel="noopener noreferrer">
              {profile.website}
            </Link>
          )}
        </DetailField>
        <DetailField label="Address" empty="Not listed">
          {profile.address}
        </DetailField>
        <DetailField label="Opening hours" empty="Not listed">
          {profile.openingHours.length > 0 && (
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
              {profile.openingHours.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </Stack>
          )}
        </DetailField>
        <DetailField label="Google Maps">
          {profile.mapUrl && (
            <Link href={profile.mapUrl} target="_blank" rel="noopener noreferrer">
              {t('Open on Google Maps')}
            </Link>
          )}
        </DetailField>
      </DetailList>
      <Divider />
      <GoogleReviews reviews={profile.reviews} />
      <Text size="caption" color="text.secondary">
        {t('Read live from Google each time; not stored in the CRM.')}
      </Text>
    </Stack>
  );
}
