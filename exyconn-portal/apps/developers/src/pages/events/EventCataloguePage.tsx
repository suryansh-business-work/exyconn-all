import { useT } from '@exyconn/i18n';
import { Alert, Box, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useWebhookEventCatalogueQuery,
  type WebhookEventCatalogueQuery,
} from '@exyconn/shell/graphql/generated';

type EventRow = WebhookEventCatalogueQuery['webhookEventCatalogue'][number] & { id: string };

const mono = { fontFamily: 'monospace' };

const COLUMNS: Column<EventRow>[] = [
  {
    key: 'event',
    label: 'Event',
    render: (row) => (
      <Box component="span" sx={mono}>
        {row.event}
      </Box>
    ),
  },
  { key: 'module', label: 'Module' },
  { key: 'description', label: 'What it means' },
  {
    key: 'fields',
    label: 'data fields',
    render: (row) => (
      <Box component="span" sx={{ ...mono, wordBreak: 'break-word' }}>
        {row.fields.join(', ')}
      </Box>
    ),
  },
];

/**
 * Developers › Event catalogue: every event an endpoint can subscribe to, and the fields its
 * payload's `data` carries. Read from the server, so it always matches what is sent.
 */
export function EventCataloguePage() {
  const t = useT();
  const { data, loading, error, refetch } = useWebhookEventCatalogueQuery();
  const rows = (data?.webhookEventCatalogue ?? []).map((row) => ({ ...row, id: row.event }));

  return (
    <Box>
      <PageHeader
        title="Event catalogue"
        subtitle="What each webhook event means and what its payload carries"
      />
      <Alert severity="info" sx={{ mb: 2 }}>
        <Text size="sm" sx={{ display: 'block' }}>
          {t(
            'Every delivery is a JSON body with event, sentAt and data, posted with an x-exyconn-signature header: sha256 HMAC of `<timestamp>.<body>` with the endpoint secret, the timestamp in x-exyconn-timestamp.',
          )}
        </Text>
      </Alert>
      {error ? (
        <Alert severity="error">
          {errorMessage(error, t('The catalogue could not be loaded'))}
        </Alert>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          loading={!data && loading}
          onRefresh={() => refetch()}
          emptyMessage="No events yet."
        />
      )}
    </Box>
  );
}
