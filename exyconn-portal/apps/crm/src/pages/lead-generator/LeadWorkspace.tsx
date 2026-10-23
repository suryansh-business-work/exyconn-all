import { useCallback, useRef, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Grid, Stack } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { LatLng } from '../../maps/mapLinks';
import { LeadSearchForm, type LeadSearchValues, type SearchMode } from './forms/lead-search';
import { ImportReviewDialog } from './ImportReviewDialog';
import { ImportSummary } from './ImportSummary';
import { LeadActions } from './LeadActions';
import { LeadFilters } from './LeadFilters';
import { LeadMap } from './LeadMap';
import { LeadResults } from './LeadResults';
import { toSearchInput } from './toSearchInput';
import { useLeadEmails } from './useLeadEmails';
import { useLeadFilters } from './useLeadFilters';
import { useLeadImport } from './useLeadImport';
import { useLeadSearch } from './useLeadSearch';
import { useLeadSelection } from './useLeadSelection';
import { useSearchArea } from './useSearchArea';

const logFailure = (what: string) => (error: unknown) => portalLogger.warn(`crm: ${what}`, error);

/** Search, pick, enrich and file: the working area once Google Places is configured. */
export function LeadWorkspace({ browserKey }: Readonly<{ browserKey: string | null }>) {
  const t = useT();
  const search = useLeadSearch();
  const emails = useLeadEmails();
  const importer = useLeadImport(search.markFiled);
  const filters = useLeadFilters(search.places, emails.lookups);
  const selection = useLeadSelection(filters.visible);
  const area = useSearchArea();
  const [mode, setMode] = useState<SearchMode>('place');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const centre = useRef<LatLng | null>(null);
  const onCentreChange = useCallback((next: LatLng) => {
    centre.current = next;
  }, []);
  const mapHint = browserKey
    ? t('The map is loading…')
    : t('Searching on the map needs a Maps JavaScript key in Tech.');

  const onSearch = (values: LeadSearchValues) => {
    selection.clear();
    setFocusedId(null);
    if (values.mode === 'area') {
      area.finish();
    }
    search.search(toSearchInput(values, centre.current));
  };
  const findEmails = () => {
    emails.run(selection.selected).catch(logFailure('finding lead emails'));
  };
  const addToCrm = () => {
    importer.run(selection.selected, emails.lookups).catch(logFailure('adding leads'));
  };
  const confirmImport = (chosen: ReadonlySet<string>) => {
    importer.confirm(chosen).catch(logFailure('adding reviewed leads'));
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={2}>
          <Box sx={readingPanel}>
            <LeadSearchForm
              searching={search.loading}
              mapReady={mapReady}
              mapHint={mapHint}
              area={area.area}
              onModeChange={setMode}
              onSearch={onSearch}
            />
          </Box>
          {importer.summary && (
            <ImportSummary summary={importer.summary} onClose={importer.dismiss} />
          )}
          {importer.error && <Alert severity="error">{importer.error}</Alert>}
          {importer.review && (
            <ImportReviewDialog
              previews={importer.review.previews}
              onConfirm={confirmImport}
              onCancel={importer.cancel}
            />
          )}
          <Box sx={readingPanel}>
            <Stack spacing={1}>
              {search.places.length > 0 && (
                <>
                  <LeadFilters
                    shown={filters.visible.length}
                    total={search.places.length}
                    hasPhone={filters.hasPhone}
                    hasEmail={filters.hasEmail}
                    needsLookup={filters.needsLookup}
                    onTogglePhone={filters.togglePhone}
                    onToggleEmail={filters.toggleEmail}
                  />
                  <LeadActions
                    total={filters.visible.length}
                    selected={selection.selected.length}
                    findingEmails={emails.running}
                    importing={importer.loading}
                    onToggleAll={selection.toggleAll}
                    onFindEmails={findEmails}
                    onImport={addToCrm}
                  />
                </>
              )}
              <LeadResults
                places={filters.visible}
                total={search.places.length}
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
      <Grid size={{ xs: 12, md: 7 }}>
        <LeadMap
          apiKey={browserKey}
          mapReady={mapReady}
          places={filters.visible}
          focusedId={focusedId}
          onFocus={setFocusedId}
          onReadyChange={setMapReady}
          onCentreChange={onCentreChange}
          area={area}
          drawEnabled={mode === 'area'}
        />
      </Grid>
    </Grid>
  );
}
