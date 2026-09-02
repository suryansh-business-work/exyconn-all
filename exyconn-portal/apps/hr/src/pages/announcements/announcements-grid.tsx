import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListAnnouncementsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAnnouncementRow =
  ListAnnouncementsPagedQuery['listAnnouncementsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type AnnouncementsGridContext = DatedCrudGridContext<PagedAnnouncementRow>;

/** Column model for the server-side Announcements grid. Title/category hit the server filter. */
export const ANNOUNCEMENT_COLUMNS: ColDef<PagedAnnouncementRow>[] = [
  textColumn('title', 'Title'),
  statusColumn('category', 'Category'),
  boolColumn('pinned', 'Pinned'),
  dateColumn('publishedAt', 'Published'),
  dateColumn('expiresAt', 'Expires'),
  actionsColumn(),
];
