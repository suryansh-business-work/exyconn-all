import { useT } from '@exyconn/i18n';
import { Alert, Box, Button } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGoogleMapsClientConfigQuery } from '@exyconn/shell/graphql/generated';
import { LeadGeneratorSkeleton } from './LeadGeneratorSkeleton';
import { LeadWorkspace } from './LeadWorkspace';
import { PlacesNotConfigured } from './PlacesNotConfigured';

const logFailure = (what: string) => (error: unknown) => portalLogger.warn(`crm: ${what}`, error);

/**
 * CRM > Tools > Lead generator: find businesses on Google Places, read their websites for
 * email addresses, and file the chosen ones as CRM companies with their phone, address and map.
 */
export function LeadGeneratorPage() {
  const t = useT();
  const { data, loading, error, refetch } = useGoogleMapsClientConfigQuery({
    fetchPolicy: 'cache-and-network',
  });
  const config = data?.googleMapsClientConfig;
  const retry = () => {
    refetch().catch(logFailure('reloading the Google Maps config'));
  };

  let body;
  if (error && !config) {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the lead generator.'))}
      </Alert>
    );
  } else if (loading && !config) {
    body = <LeadGeneratorSkeleton />;
  } else if (config?.placesReady) {
    body = <LeadWorkspace browserKey={config.browserKey ?? null} />;
  } else {
    body = <PlacesNotConfigured />;
  }

  return (
    <Box>
      <PageHeader
        title="Lead generator"
        subtitle="Find businesses on Google Places and add them to the CRM as companies"
      />
      {body}
    </Box>
  );
}
