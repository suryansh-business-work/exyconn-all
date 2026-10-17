import { useT } from '@exyconn/i18n';
import { Alert, Button, List, Stack, Text } from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { LeadRow } from './LeadRow';
import type { EmailLookup, LeadPlace } from './leadTypes';

interface LeadResultsProps {
  /** The places that pass the filters. */
  places: LeadPlace[];
  /** How many were loaded before filtering. */
  total: number;
  loading: boolean;
  error: string | null;
  searched: boolean;
  hasMore: boolean;
  checked: ReadonlySet<string>;
  focusedId: string | null;
  lookups: Record<string, EmailLookup>;
  onToggle: (placeId: string) => void;
  onFocus: (placeId: string) => void;
  onLoadMore: () => void;
}

/** The businesses found, numbered like their markers on the map. */
export function LeadResults({
  places,
  total,
  loading,
  error,
  searched,
  hasMore,
  checked,
  focusedId,
  lookups,
  onToggle,
  onFocus,
  onLoadMore,
}: Readonly<LeadResultsProps>) {
  const t = useT();
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (loading && total === 0) {
    return <ListSkeleton toolbar={false} rows={4} columns={2} label="Searching for businesses" />;
  }
  if (total === 0) {
    return (
      <Text color="text.secondary" role="status">
        {searched
          ? t('No businesses matched. Try a broader search or another place.')
          : t('Search for a kind of business in a place to see leads here.')}
      </Text>
    );
  }
  return (
    <Stack spacing={1}>
      {places.length === 0 && (
        <Text color="text.secondary" role="status">
          {t('No businesses match these filters.')}
        </Text>
      )}
      <List aria-label={t('Businesses found')} disablePadding>
        {places.map((place, index) => (
          <LeadRow
            key={place.placeId}
            place={place}
            number={index + 1}
            checked={checked.has(place.placeId)}
            focused={focusedId === place.placeId}
            lookup={lookups[place.placeId]}
            onToggle={onToggle}
            onFocus={onFocus}
          />
        ))}
      </List>
      {hasMore && (
        <Button variant="outlined" onClick={onLoadMore} disabled={loading}>
          {loading ? t('Loading…') : t('Load 20 more')}
        </Button>
      )}
    </Stack>
  );
}
