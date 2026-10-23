import { countryName } from '@exyconn/i18n';
import { Card, CardContent, Stack } from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { EmailLink } from '@exyconn/shell/components/email';
import type { ClientCounts, ClientDetail } from '../client-detail.types';

interface OverviewTabProps {
  client: ClientDetail;
  /** Null until the counts arrive; the tiles show placeholders meanwhile. */
  counts: ClientCounts | null;
}

type CountKey = keyof Omit<ClientCounts, '__typename'>;
type Tile = { key: CountKey; label: string };

const FIRST_ROW: readonly Tile[] = [
  { key: 'contacts', label: 'Hub contacts' },
  { key: 'openInvoices', label: 'Unpaid invoices' },
  { key: 'openTickets', label: 'Open tickets' },
  { key: 'projects', label: 'Projects' },
];
const SECOND_ROW: readonly Tile[] = [
  { key: 'communications', label: 'Logged communications' },
  { key: 'links', label: 'Important links' },
  { key: 'sharedItems', label: 'Shared contracts & documents' },
  { key: 'payments', label: 'Payments' },
];

const statsOf = (tiles: readonly Tile[], counts: ClientCounts | null) =>
  tiles.map((tile) => ({ label: tile.label, value: String(counts?.[tile.key] ?? 0) }));

/** Who the client is, and how much there is under each tab. */
export function OverviewTab({ client, counts }: Readonly<OverviewTabProps>) {
  const { formatDate } = useSettings();
  const country = client.country ? countryName(client.country) : '';
  const place = [client.city, client.region, country].filter(Boolean).join(', ');
  const taxId = client.taxId ? `${client.taxIdLabel} ${client.taxId}` : '—';
  return (
    <Stack spacing={2}>
      <StatRow stats={statsOf(FIRST_ROW, counts)} loading={counts === null} />
      <StatRow stats={statsOf(SECOND_ROW, counts)} loading={counts === null} />
      <Card variant="outlined">
        <CardContent>
          <DetailFactGrid>
            <DetailFact label="Contact person">{client.name}</DetailFact>
            <DetailFact label="Email">
              <EmailLink address={client.email} />
            </DetailFact>
            <DetailFact label="Phone">{client.phone || '—'}</DetailFact>
            <DetailFact label="Location">{place || '—'}</DetailFact>
            <DetailFact label="Billing address">{client.billingAddress || '—'}</DetailFact>
            <DetailFact label="Tax ID">{taxId}</DetailFact>
            <DetailFact label="Currency">{client.currency || '—'}</DetailFact>
            <DetailFact label="Client since">{formatDate(client.createdAt)}</DetailFact>
          </DetailFactGrid>
        </CardContent>
      </Card>
    </Stack>
  );
}
