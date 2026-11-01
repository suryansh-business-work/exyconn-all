import type { ColDef } from 'ag-grid-community';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListWebhookDeliveriesPagedQuery } from '@exyconn/shell/graphql/generated';

export type DeliveryRow =
  ListWebhookDeliveriesPagedQuery['listWebhookDeliveriesPaged']['rows'][number];
export type DeliveriesGridContext = DatedCrudGridContext<DeliveryRow>;

const VIEW_ACTION: RowActionSpec = {
  key: 'view',
  label: 'see the payload and the response',
  icon: VisibilityIcon,
  color: 'primary',
};

/** Every delivery attempt across every endpoint: what was sent, where, and what came back. */
export const DELIVERY_COLUMNS: ColDef<DeliveryRow>[] = [
  dateColumn('createdAt', 'Queued'),
  valueColumn('webhookId', 'Endpoint', (row) => row.webhookName || row.webhookId),
  textColumn('event', 'Event'),
  statusColumn('status', 'Status'),
  valueColumn('attempts', 'Attempts', (row) => String(row.attempts)),
  valueColumn('responseStatus', 'Response', (row) => row.responseStatus?.toString() ?? ''),
  textColumn('error', 'Error'),
  dateColumn('deliveredAt', 'Delivered'),
  actionsColumn([VIEW_ACTION]),
];
