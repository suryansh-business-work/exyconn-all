import type { ItIncidentFieldsFragment } from '@exyconn/shell/graphql/generated';

/** One incident, with its timeline and follow-ups. */
export type IncidentRow = ItIncidentFieldsFragment;

/** One post-incident action as the form edits it. */
export interface FollowUpValues {
  title: string;
  ownerName: string;
  /** ISO string from the picker; empty when no date was set. */
  dueAt: string;
  done: boolean;
}
