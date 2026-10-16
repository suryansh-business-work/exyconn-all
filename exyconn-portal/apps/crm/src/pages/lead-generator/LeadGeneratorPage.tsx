import { useCallback, useRef, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Grid, Stack } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGoogleMapsClientConfigQuery } from '@exyconn/shell/graphql/generated';
import type { LatLng } from '../../maps/mapLinks';
import { LeadSearchForm, type LeadSearchValues } from './forms/lead-search';
import { ImportSummary } from './ImportSummary';
import { LeadActions } from './LeadActions';
import { LeadGeneratorSkeleton } from './LeadGeneratorSkeleton';
import { LeadMap } from './LeadMap';
import { LeadResults } from './LeadResults';
import { PlacesNotConfigured } from './PlacesNotConfigured';
import { toSearchInput } from './toSearchInput';
import { useLeadEmails } from './useLeadEmails';
import { useLeadImport } from './useLeadImport';
import { useLeadSearch } from './useLeadSearch';
import { useLeadSelection } from './useLeadSelection';

const logFailure = (what: string) => (error: unknown) => portalLogger.warn(`crm: ${what}`, error);

/** Search, pick, enrich and file: the working area once Google Places is configured. */
function LeadWorkspace({ browserKey }: Readonly<{ browserKey: string | null }>) {
  const t = useT();
  const search = useLeadSearch();
  const emails = useLeadEmails();
  const importer = useLeadImport(search.markFiled);
  const selection = useLeadSelection(search.places);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const centre = useRef<LatLng | null>(null);
  const onMapReady = useCallback(() => setMapReady(true), []);
  const onCentreChange = useCallback((next: LatLng) => {
    centre.current = next;
  }, []);

  const onSearch = (values: LeadSearchValues) => {
    selection.clear();
    setFocusedId(null);
    search.search(toSearchInput(values, centre.current));
  };
  const findEmails = () => {
    emails.run(selection.selected).catch(logFailure('finding lead emails'));
  };
  const addToCrm = () => {
    importer.run(selection.selected, emails.lookups).catch(logFailure('adding leads'));
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={2}>
          <Box sx={readingPanel}>
            <LeadSearchForm searching={search.loading} mapReady={mapReady} onSearch={onSearch} />
          </Box>
          {!browserKey && (
            <Alert severity="info">
              {t('Add a Maps JavaScript key in Tech to see the results on a map.')}
            </Alert>
          )}
          {importer.summary && (
            <ImportSummary summary={importer.summary} onClose={importer.dismiss} />
          )}
          {importer.error && <Alert severity="error">{importer.error}</Alert>}
          <Box sx={readingPanel}>
            <Stack spacing={1}>
              {search.places.length > 0 && (
                <LeadActions
                  total={search.places.length}
                  selected={selection.selected.length}
                  findingEmails={emails.running}
                  importing={importer.loading}
                  onToggleAll={selection.toggleAll}
                  onFindEmails={findEmails}
                  onImport={addToCrm}
                />
              )}
              <LeadResults
                places={search.places}
                loading={search.loading}
                error={search.error}
                searched={search.searched}
                hasMore={search.hasMore}
                checked={selection.ids}
                focusedId={focusedId}
                lookups={emails.lookups}
                onToggle={selection.toggle}
                onFocus={setFocusedId}
                onLoadMore={search.loadMore}
              />
            </Stack>
          </Box>
        </Stack>
      </Grid>
      {browserKey && (
        <Grid size={{ xs: 12, md: 7 }}>
          <LeadMap
            apiKey={browserKey}
            places={search.places}
            focusedId={focusedId}
            onFocus={setFocusedId}
            onReady={onMapReady}
            onCentreChange={onCentreChange}
          />
        </Grid>
      )}
    </Grid>
  );
}

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
