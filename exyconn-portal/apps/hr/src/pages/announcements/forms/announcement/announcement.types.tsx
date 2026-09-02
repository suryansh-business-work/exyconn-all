import type {
  ListAnnouncementsPagedQuery,
  AnnouncementCategory,
} from '@exyconn/shell/graphql/generated';

export type AnnouncementRow = ListAnnouncementsPagedQuery['listAnnouncementsPaged']['rows'][number];

export interface AnnouncementFormValues {
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  publishedAt: string;
  /** Empty string means "never expires" and is sent to the API as null. */
  expiresAt: string;
}
