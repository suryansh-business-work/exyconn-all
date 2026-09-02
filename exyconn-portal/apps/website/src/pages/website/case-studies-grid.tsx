import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import type { ListCaseStudiesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedCaseStudyRow = ListCaseStudiesPagedQuery['listCaseStudiesPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the case-study cells via its `context`. */
export interface CaseStudiesGridContext {
  onEdit: (row: PagedCaseStudyRow) => void;
  onDelete: (row: PagedCaseStudyRow) => void;
  formatDate: (value: string) => string;
}

function FeaturedCell(params: Readonly<ICellRendererParams<PagedCaseStudyRow>>) {
  if (!params.data) {
    return null;
  }
  return <BoolChip value={params.data.featured} />;
}

function PublishedCell(params: Readonly<ICellRendererParams<PagedCaseStudyRow>>) {
  const row = params.data;
  const ctx = params.context as CaseStudiesGridContext;
  if (!row) {
    return null;
  }
  return <>{ctx.formatDate(row.publishedAt)}</>;
}

function CaseStudyActionsCell(params: Readonly<ICellRendererParams<PagedCaseStudyRow>>) {
  const row = params.data;
  const ctx = params.context as CaseStudiesGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedCaseStudyRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Case Studies grid. Text columns hit the server filter. */
export const CASE_STUDY_COLUMNS: ColDef<PagedCaseStudyRow>[] = [
  { field: 'title', headerName: 'Title' },
  { field: 'slug', headerName: 'Slug' },
  { field: 'category', headerName: 'Category' },
  { field: 'author', headerName: 'Author' },
  {
    field: 'featured',
    headerName: 'Featured',
    cellRenderer: FeaturedCell,
    filter: false,
    floatingFilter: false,
  },
  {
    field: 'publishedAt',
    headerName: 'Published',
    cellRenderer: PublishedCell,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: CaseStudyActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
