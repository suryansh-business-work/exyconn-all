import type { MaLanguage, MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';

/** The meeting the form edits, as the detail page loaded it. */
export type MeetingDetailsRow = Pick<MaMeetingDetailFragment, 'id' | 'title' | 'language'>;

/** What the form submits: the input of `maUpdateMeeting`. */
export interface MeetingDetailsValues {
  title: string;
  language: MaLanguage;
}
