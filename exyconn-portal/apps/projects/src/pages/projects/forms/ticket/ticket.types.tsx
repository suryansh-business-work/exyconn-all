import type { TaskFieldsFragment } from '@exyconn/shell/graphql/generated';

/** The ticket as every ticket screen reads it — the generated fragment, unchanged. */
export type TicketRow = TaskFieldsFragment;

/** Somebody a ticket can be assigned to, as the picker needs them. */
export interface TicketAssigneeOption {
  value: string;
  label: string;
}

/** What the ticket form edits. Points is a string because a text input holds strings. */
export interface TicketFormValues {
  title: string;
  description: string;
  type: string;
  priority: string;
  assigneeId: string;
  labels: string[];
  storyPoints: string;
  dueDate: string;
}
