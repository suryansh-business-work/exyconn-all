import type { ColDef } from 'ag-grid-community';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import {
  WebsiteChatKnowledgeSource,
  type WebsiteChatKnowledgePagedQuery,
} from '@exyconn/shell/graphql/generated';
import { activeStatus } from '../../website/active-status';

export type ChatKnowledgePagedRow =
  WebsiteChatKnowledgePagedQuery['listWebsiteChatKnowledgeEntriesPaged']['rows'][number];

export type ChatKnowledgeGridContext = DatedCrudGridContext<ChatKnowledgePagedRow>;

/** Where a knowledge entry came from, as the team says it. */
export const SOURCE_LABEL: Record<WebsiteChatKnowledgeSource, string> = {
  [WebsiteChatKnowledgeSource.Website]: 'Website',
  [WebsiteChatKnowledgeSource.Custom]: 'Custom',
};

/** Column model for the Knowledge Bot's knowledge; the search box looks through title, link and content. */
export const CHAT_KNOWLEDGE_COLUMNS: ColDef<ChatKnowledgePagedRow>[] = [
  statusColumn('source', 'Source', (row) => SOURCE_LABEL[row.source]),
  statusColumn<ChatKnowledgePagedRow>('isActive', 'Status', activeStatus),
  { ...valueColumn<ChatKnowledgePagedRow>('title', 'Title', (row) => row.title), minWidth: 240 },
  {
    ...valueColumn<ChatKnowledgePagedRow>('url', 'Link', (row) => row.url),
    sortable: false,
    minWidth: 220,
  },
  dateColumn('updatedAt', 'Updated'),
  actionsColumn([EDIT_ACTION, DELETE_ACTION]),
];
