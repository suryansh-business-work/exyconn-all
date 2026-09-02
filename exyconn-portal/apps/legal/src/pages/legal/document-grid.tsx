import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import { Link } from '@exyconn/shell/components/ui';
import type { ListLegalDocumentsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLegalDocumentRow =
  ListLegalDocumentsPagedQuery['listLegalDocumentsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type DocumentsGridContext = CrudGridContext<PagedLegalDocumentRow>;

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

/** Column model for the server-side Documents grid. Title/Owner hit the server filter. */
export const DOCUMENT_COLUMNS: ColDef<PagedLegalDocumentRow>[] = [
  textColumn('title', 'Title'),
  statusColumn('category', 'Category'),
  textColumn('owner', 'Owner', (row) => row.owner ?? '—'),
  statusColumn('status', 'Status'),
  {
    field: 'fileUrl',
    headerName: 'Link',
    cellRenderer: FileLinkCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  actionsColumn(),
];
