import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton, Link } from '@/components/ui';
import { StatusChip } from '../../../components/data/StatusChip';
import type { ListLegalDocumentsPagedQuery } from '../../../graphql/generated';

export type PagedLegalDocumentRow =
  ListLegalDocumentsPagedQuery['listLegalDocumentsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the document cells via its `context`. */
export interface DocumentsGridContext {
  onEdit: (row: PagedLegalDocumentRow) => void;
  onDelete: (row: PagedLegalDocumentRow) => void;
}

function CategoryCell(params: Readonly<ICellRendererParams<PagedLegalDocumentRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.category} />;
}

function StatusCell(params: Readonly<ICellRendererParams<PagedLegalDocumentRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.status} />;
}

function OwnerCell(params: Readonly<ICellRendererParams<PagedLegalDocumentRow>>) {
  const row = params.data;
  if (!row) {
    return null;
  }
  return <>{row.owner ?? '—'}</>;
}

function FileLinkCell(params: Readonly<ICellRendererParams<PagedLegalDocumentRow>>) {
  const row = params.data;
  if (!row) {
    return null;
  }
  if (!row.fileUrl) {
    return <>—</>;
  }
  return (
    <Link href={row.fileUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
      Open
    </Link>
  );
}

function DocumentActionsCell(params: Readonly<ICellRendererParams<PagedLegalDocumentRow>>) {
  const row = params.data;
  const ctx = params.context as DocumentsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedLegalDocumentRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Documents grid. Title/Owner hit the server filter. */
export const DOCUMENT_COLUMNS: ColDef<PagedLegalDocumentRow>[] = [
  { field: 'title', headerName: 'Title' },
  {
    field: 'category',
    headerName: 'Category',
    cellRenderer: CategoryCell,
    filter: false,
    floatingFilter: false,
  },
  { field: 'owner', headerName: 'Owner', cellRenderer: OwnerCell },
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: StatusCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'fileUrl',
    headerName: 'Link',
    cellRenderer: FileLinkCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: DocumentActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
