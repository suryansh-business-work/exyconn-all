import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import type { ListBlogPostsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedBlogRow = ListBlogPostsPagedQuery['listBlogPostsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the blog cells via its `context`. */
export interface BlogGridContext {
  onEdit: (row: PagedBlogRow) => void;
  onDelete: (row: PagedBlogRow) => void;
  formatDate: (value: string) => string;
}

function authorFormatter(params: ValueFormatterParams<PagedBlogRow>): string {
  return params.data?.author.name ?? '';
}

function tagsFormatter(params: ValueFormatterParams<PagedBlogRow>): string {
  return params.data?.tags.join(', ') ?? '';
}

function FeaturedCell(params: Readonly<ICellRendererParams<PagedBlogRow>>) {
  if (!params.data) {
    return null;
  }
  return <BoolChip value={params.data.featured} />;
}

function PublishedCell(params: Readonly<ICellRendererParams<PagedBlogRow>>) {
  const row = params.data;
  const ctx = params.context as BlogGridContext;
  if (!row) {
    return null;
  }
  return <>{ctx.formatDate(row.publishedAt)}</>;
}

function BlogActionsCell(params: Readonly<ICellRendererParams<PagedBlogRow>>) {
  const row = params.data;
  const ctx = params.context as BlogGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedBlogRow) => void) => (event: MouseEvent) => {
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

/** Column model for the server-side Blog grid. Title/Slug hit the server filter. */
export const BLOG_COLUMNS: ColDef<PagedBlogRow>[] = [
  { field: 'title', headerName: 'Title' },
  { field: 'slug', headerName: 'Slug' },
  {
    colId: 'author',
    headerName: 'Author',
    valueFormatter: authorFormatter,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'tags',
    headerName: 'Tags',
    valueFormatter: tagsFormatter,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
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
    cellRenderer: BlogActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 120,
    minWidth: 120,
  },
];
