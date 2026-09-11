import type { ColDef } from 'ag-grid-community';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  boolColumn,
  dateColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListCaseStudiesPagedQuery } from '@exyconn/shell/graphql/generated';
import { LIVE_EDIT_ACTION } from './live-edit/live-edit.action';

export type PagedCaseStudyRow = ListCaseStudiesPagedQuery['listCaseStudiesPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type CaseStudiesGridContext = DatedCrudGridContext<PagedCaseStudyRow>;

/** Column model for the server-side Case Studies grid. Title/Slug hit the server filter. */
export const CASE_STUDY_COLUMNS: ColDef<PagedCaseStudyRow>[] = [
  textColumn('title', 'Title'),
  textColumn('slug', 'Slug'),
  textColumn('category', 'Category'),
  textColumn('author', 'Author'),
  boolColumn('featured', 'Featured'),
  dateColumn('publishedAt', 'Published'),
  actionsColumn([EDIT_ACTION, LIVE_EDIT_ACTION, DELETE_ACTION]),
];
