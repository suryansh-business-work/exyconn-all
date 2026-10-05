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
import type { WebsiteChatFaqsPagedQuery } from '@exyconn/shell/graphql/generated';
import { activeStatus } from '../../website/active-status';

export type ChatFaqPagedRow = WebsiteChatFaqsPagedQuery['listWebsiteChatFaqsPaged']['rows'][number];

export type ChatFaqsGridContext = DatedCrudGridContext<ChatFaqPagedRow>;

/** Column model for the chat widget's FAQs; the search box looks through questions and answers. */
export const CHAT_FAQ_COLUMNS: ColDef<ChatFaqPagedRow>[] = [
  { ...valueColumn<ChatFaqPagedRow>('question', 'Question', (row) => row.question), minWidth: 240 },
  {
    ...valueColumn<ChatFaqPagedRow>('answer', 'Answer', (row) => row.answer),
    sortable: false,
    minWidth: 280,
  },
  valueColumn('sortOrder', 'Order', (row) => String(row.sortOrder)),
  statusColumn<ChatFaqPagedRow>('isActive', 'Status', activeStatus),
  dateColumn('updatedAt', 'Updated'),
  actionsColumn([EDIT_ACTION, DELETE_ACTION]),
];
