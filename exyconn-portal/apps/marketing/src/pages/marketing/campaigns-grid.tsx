import type { ColDef } from 'ag-grid-community';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListCampaignsPagedQuery } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';

export type PagedCampaignRow = ListCampaignsPagedQuery['listCampaignsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type CampaignsGridContext = DatedCrudGridContext<PagedCampaignRow>;

const VIEW_ACTION: RowActionSpec = { key: 'view', label: 'view campaign', icon: VisibilityIcon };

const SEND_ACTION: RowActionSpec = {
  key: 'send',
  label: 'review and send',
  icon: SendIcon,
  color: 'primary',
};

/** Column model for the server-side Campaigns grid. Name hits the server filter. */
export const CAMPAIGN_COLUMNS: ColDef<PagedCampaignRow>[] = [
  textColumn('name', 'Name'),
  statusColumn('campaignType', 'Type'),
  textColumn('subject', 'Subject', (row) => row.subject || '—'),
  statusColumn('sendState', 'Delivery'),
  dateColumn('lastSentAt', 'Last sent', '—'),
  valueColumn('budget', 'Budget', (row) => formatMoney(row.budget, row.budgetCurrency)),
  actionsColumn([VIEW_ACTION, SEND_ACTION, EDIT_ACTION, DELETE_ACTION], 150),
];
