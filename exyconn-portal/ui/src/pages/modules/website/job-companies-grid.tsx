import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@/components/ui';
import { StatusChip } from '../../../components/data/StatusChip';
import type { ListJobCompaniesPagedQuery } from '../../../graphql/generated';

export type PagedJobCompanyRow =
  ListJobCompaniesPagedQuery['listJobCompaniesPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the company cells via its `context`. */
export interface JobCompaniesGridContext {
  onEdit: (row: PagedJobCompanyRow) => void;
  onDelete: (row: PagedJobCompanyRow) => void;
}

function orderFormatter(params: ValueFormatterParams<PagedJobCompanyRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return String(row.order);
}

function StatusCell(params: Readonly<ICellRendererParams<PagedJobCompanyRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.isActive ? 'ACTIVE' : 'INACTIVE'} />;
}

function JobCompanyActionsCell(params: Readonly<ICellRendererParams<PagedJobCompanyRow>>) {
  const row = params.data;
  const ctx = params.context as JobCompaniesGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedJobCompanyRow) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <IconButton size="small" aria-label="edit" onClick={run(ctx.onEdit)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="delete" onClick={run(ctx.onDelete)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

/** Column model for the server-side Job Companies grid. Text columns hit the server filter. */
export const JOB_COMPANY_COLUMNS: ColDef<PagedJobCompanyRow>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'slug', headerName: 'Slug' },
  { field: 'companyCode', headerName: 'Code' },
  { field: 'industry', headerName: 'Industry' },
  {
    field: 'isActive',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'order',
    headerName: 'Order',
    valueFormatter: orderFormatter,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: JobCompanyActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
