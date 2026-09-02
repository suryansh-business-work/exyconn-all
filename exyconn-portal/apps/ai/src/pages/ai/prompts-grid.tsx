import type { MouseEvent } from 'react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Flex, Chip, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ListPromptsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedPromptRow = ListPromptsPagedQuery['listPromptsPaged']['rows'][number];

/** Page-level handlers ag-grid hands to the prompt cells via its `context`. */
export interface PromptsGridContext {
  onEdit: (row: PagedPromptRow) => void;
  onDelete: (row: PagedPromptRow) => void;
  onCopy: (row: PagedPromptRow) => void;
}

function contentFormatter(params: ValueFormatterParams<PagedPromptRow>): string {
  const row = params.data;
  if (!row) {
    return '';
  }
  return row.content.slice(0, 60);
}

function CategoryCell(params: Readonly<ICellRendererParams<PagedPromptRow>>) {
  if (!params.data) {
    return null;
  }
  return <StatusChip value={params.data.category} />;
}

function TagsCell(params: Readonly<ICellRendererParams<PagedPromptRow>>) {
  const row = params.data;
  if (!row) {
    return null;
  }
  if (!row.tags.length) {
    return <>—</>;
  }
  return (
    <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {row.tags.map((tag) => (
        <Chip key={tag} size="small" variant="outlined" label={tag} />
      ))}
    </Flex>
  );
}

function PromptActionsCell(params: Readonly<ICellRendererParams<PagedPromptRow>>) {
  const row = params.data;
  const ctx = params.context as PromptsGridContext;
  if (!row) {
    return null;
  }
  const run = (handler: (target: PagedPromptRow) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <IconButton size="small" color="primary" aria-label="copy prompt" onClick={run(ctx.onCopy)}>
        <ContentCopyIcon fontSize="small" />
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

/** Column model for the server-side Prompt Library grid. Title/Content hit the server filter. */
export const PROMPT_COLUMNS: ColDef<PagedPromptRow>[] = [
  { field: 'title', headerName: 'Title' },
  {
    field: 'category',
    headerName: 'Category',
    cellRenderer: CategoryCell,
    filter: false,
    floatingFilter: false,
  },
  { field: 'content', headerName: 'Prompt', valueFormatter: contentFormatter },
  {
    colId: 'tags',
    headerName: 'Tags',
    cellRenderer: TagsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    colId: 'actions',
    headerName: '',
    cellRenderer: PromptActionsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
    flex: 0,
    width: 150,
    minWidth: 150,
  },
];
