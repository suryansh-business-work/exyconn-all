import type { TabberItem } from '@exyconn/tabber';
import { ClientHubAccessPanel } from '../hub-access/ClientHubAccessPanel';
import { ClientProjectsPicker } from '../hub-access/ClientProjectsPicker';
import { OverviewTab } from './tabs/OverviewTab';
import { InvoicesTab, PaymentsTab, TicketsTab } from './tabs/LedgerTabs';
import { CommunicationsTab } from './tabs/CommunicationsTab';
import { LinksTab } from './tabs/LinksTab';
import { SharedItemsTab } from './tabs/SharedItemsTab';
import { RefundAccountsTab } from './tabs/RefundAccountsTab';
import type { ClientCounts, ClientDetail } from './client-detail.types';

/**
 * The tabs of a client's page, in the order an account manager works through them. Each
 * reads only its own data, and only while it is the open tab.
 */
export function clientTabs(
  client: ClientDetail,
  counts: ClientCounts | null,
  onChanged: () => void,
): TabberItem[] {
  const clientId = client.id;
  return [
    {
      slug: 'overview',
      label: 'Overview',
      content: <OverviewTab client={client} counts={counts} />,
    },
    { slug: 'contacts', label: 'Contacts', content: <ClientHubAccessPanel clientId={clientId} /> },
    {
      slug: 'communication',
      label: 'Communication log',
      content: <CommunicationsTab clientId={clientId} onChanged={onChanged} />,
    },
    {
      slug: 'links',
      label: 'Important links',
      content: <LinksTab clientId={clientId} onChanged={onChanged} />,
    },
    {
      slug: 'legal',
      label: 'Contracts & documents',
      content: <SharedItemsTab clientId={clientId} onChanged={onChanged} />,
    },
    { slug: 'invoices', label: 'Invoices', content: <InvoicesTab clientId={clientId} /> },
    { slug: 'payments', label: 'Payments', content: <PaymentsTab clientId={clientId} /> },
    {
      slug: 'refund-accounts',
      label: 'Refund accounts',
      content: <RefundAccountsTab clientId={clientId} />,
    },
    { slug: 'tickets', label: 'Support tickets', content: <TicketsTab clientId={clientId} /> },
    { slug: 'projects', label: 'Projects', content: <ClientProjectsPicker clientId={clientId} /> },
  ];
}
