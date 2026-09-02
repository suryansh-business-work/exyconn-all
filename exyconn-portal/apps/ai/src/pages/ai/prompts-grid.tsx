import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import { Chip, Flex } from '@exyconn/shell/components/ui';
import type { ListPromptsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedPromptRow = ListPromptsPagedQuery['listPromptsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type PromptsGridContext = CrudGridContext<PagedPromptRow>;

/** How much of a prompt body fits in the grid cell before it is truncated. */
const CONTENT_PREVIEW_CHARS = 60;

const COPY_ACTION: RowActionSpec = {
  key: 'copy',
  label: 'copy prompt',
  icon: ContentCopyIcon,
  color: 'primary',
};

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

/** Column model for the server-side Prompt Library grid. Title/Content hit the server filter. */
export const PROMPT_COLUMNS: ColDef<PagedPromptRow>[] = [
  textColumn('title', 'Title'),
  statusColumn('category', 'Category'),
  textColumn('content', 'Prompt', (row) => row.content.slice(0, CONTENT_PREVIEW_CHARS)),
  {
    colId: 'tags',
    headerName: 'Tags',
    cellRenderer: TagsCell,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  actionsColumn([COPY_ACTION, EDIT_ACTION, DELETE_ACTION]),
];
