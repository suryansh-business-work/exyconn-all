import { useState } from 'react';
import { Grid, Stack } from '@exyconn/shell/components/ui';
import { useClientHubSharedItemsQuery } from '@exyconn/shell/graphql/generated';
import { HubPageHeader } from '../HubPageHeader';
import { HubListState } from '../HubListState';
import { SharedItemCard, type HubSharedItem } from './SharedItemCard';
import { SharedItemReader } from './SharedItemReader';

/** Contracts, documents and policies our team shared with the client, with live status. */
export function DocumentsPage() {
  const { data, loading, error } = useClientHubSharedItemsQuery();
  const [reading, setReading] = useState<HubSharedItem | null>(null);
  const items = data?.clientHubSharedItems ?? [];
  return (
    <Stack spacing={3}>
      <HubPageHeader
        title="Contracts & documents"
        subtitle="Contracts, documents and policies shared with you, with where each one stands."
      />
      <HubListState
        loading={loading && !data}
        error={data ? null : error}
        errorText="Could not load your documents"
        isEmpty={items.length === 0}
        emptyTitle="Nothing shared yet"
        emptyDescription="Contracts, documents and policies we share with you appear here."
      >
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid key={item.id} size={{ xs: 12, md: 6 }}>
              <SharedItemCard item={item} onRead={setReading} />
            </Grid>
          ))}
        </Grid>
      </HubListState>
      <SharedItemReader item={reading} onClose={() => setReading(null)} />
    </Stack>
  );
}
