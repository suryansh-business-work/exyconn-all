import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListKbArticlesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedKbArticleRow = ListKbArticlesPagedQuery['listKbArticlesPaged']['rows'][number];
export type KbArticlesGridContext = DatedCrudGridContext<PagedKbArticleRow>;

/** Column model for the knowledge-base register. */
export const KB_ARTICLE_COLUMNS: ColDef<PagedKbArticleRow>[] = [
  textColumn('title', 'Title'),
  statusColumn('category', 'Category'),
  textColumn('summary', 'Summary'),
  boolColumn('isPublished', 'Published'),
  textColumn('updatedByName', 'Last edited by'),
  dateColumn('updatedAt', 'Updated'),
  actionsColumn(),
];
