import type { TaskFieldsFragment } from '@exyconn/shell/graphql/generated';

/** View models for the project board. */
export interface ColumnView {
  id: string;
  name: string;
}

/**
 * A ticket on the board. It is the generated fragment as-is: the card, the ticket dialog and
 * the ticket table all read the same shape, so a field added to the query reaches all three.
 */
export type TaskView = TaskFieldsFragment;

export type DragType = 'column' | 'task';
