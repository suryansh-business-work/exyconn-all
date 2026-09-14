import type { ManagementReviewFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ReviewRow = ManagementReviewFieldsFragment;

export interface ReviewActionValues {
  description: string;
  ownerName: string;
  dueOn: Date | null;
  done: boolean;
}

export interface ReviewFormValues {
  title: string;
  standards: string[];
  heldOn: Date | null;
  chairName: string;
  attendees: string;
  inputs: string;
  decisions: string;
  actions: ReviewActionValues[];
  status: string;
}
