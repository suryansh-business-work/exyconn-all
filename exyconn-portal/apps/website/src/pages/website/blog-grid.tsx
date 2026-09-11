import type { ColDef } from 'ag-grid-community';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListBlogPostsPagedQuery } from '@exyconn/shell/graphql/generated';
import { LIVE_EDIT_ACTION } from './live-edit/live-edit.action';

export type PagedBlogRow = ListBlogPostsPagedQuery['listBlogPostsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type BlogGridContext = DatedCrudGridContext<PagedBlogRow>;

/** Column model for the server-side Blog grid. Title/Slug hit the server filter. */
export const BLOG_COLUMNS: ColDef<PagedBlogRow>[] = [
  textColumn('title', 'Title'),
  textColumn('slug', 'Slug'),
  derivedColumn('author', 'Author', (row) => row.author.name),
  derivedColumn('tags', 'Tags', (row) => row.tags.join(', ')),
  boolColumn('featured', 'Featured'),
  dateColumn('publishedAt', 'Published'),
  actionsColumn([EDIT_ACTION, LIVE_EDIT_ACTION, DELETE_ACTION]),
];
