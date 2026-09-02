import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListAiJobsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAiJobRow = ListAiJobsPagedQuery['listAiJobsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type AiJobsGridContext = CrudGridContext<PagedAiJobRow>;

/** How much of a prompt fits in the grid cell before it is truncated. */
const PROMPT_PREVIEW_CHARS = 48;

/** Column model for the server-side AI Jobs grid. Name/Model/Prompt hit the server filter. */
export const AI_JOB_COLUMNS: ColDef<PagedAiJobRow>[] = [
  textColumn('name', 'Name'),
  textColumn('model', 'Model'),
  textColumn('prompt', 'Prompt', (row) => row.prompt.slice(0, PROMPT_PREVIEW_CHARS)),
  statusColumn('status', 'Status'),
  actionsColumn(),
];
