import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@/components/ui';
import { StatusChip } from '../../../components/data/StatusChip';
import type { ListCampaignsPagedQuery } from '../../../graphql/generated';

export type PagedCampaignRow = ListCampaignsPagedQuery['listCampaignsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the campaign cells via its `context`. */
export interface CampaignsGridContext {
  onEdit: (row: PagedCampaignRow) => void;
  onDelete: (row: PagedCampaignRow) => void;
  onViewDetails: (row: PagedCampaignRow) => void;
  onSend: (row: PagedCampaignRow) => void;
  formatDate: (value: string) => string;
}

function budgetFormatter(params: ValueFormatterParams<PagedCampaignRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return row.budget.toLocaleString();
}

function ChannelCell(params: Readonly<ICellRendererParams<PagedCampaignRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.channel} />;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedCampaignRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function LastSentCell(params: Readonly<ICellRendererParams<PagedCampaignRow>>) {
  const row = params.data;
  const ctx = params.context as CampaignsGridContext;
  if (!row) {
    return null;
  }
  return <>{row.lastSentAt ? ctx.formatDate(row.lastSentAt) : '—'}</>;
}

function CampaignActionsCell(params: Readonly<ICellRendererParams<PagedCampaignRow>>) {
  const row = params.data;
  const ctx = params.context as CampaignsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedCampaignRow) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <IconButton size="small" aria-label="view campaign" onClick={run(ctx.onViewDetails)}>
        <VisibilityIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color="primary"
        aria-label="send campaign"
        onClick={run(ctx.onSend)}
      >
        <SendIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="edit" onClick={run(ctx.onEdit)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="delete" onClick={run(ctx.onDelete)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

/** Column model for the server-side Campaigns grid. Name hits the server filter. */
export const CAMPAIGN_COLUMNS: ColDef<PagedCampaignRow>[] = [
  { field: 'name', headerName: 'Name' },
  {
    field: 'channel',
    headerName: 'Channel',
    cellRenderer: ChannelCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'budget',
    headerName: 'Budget',
    valueFormatter: budgetFormatter,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'lastSentAt',
    headerName: 'Last sent',
    cellRenderer: LastSentCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: CampaignActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 150,
    minWidth: 150,
  },
];
