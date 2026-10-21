import type {
  MaActionItemInput,
  MaActionItemRowFragment,
  MaActionStatus,
  MaPriority,
} from '@exyconn/shell/graphql/generated';

/** A checklist item as the grid holds it. */
export type ActionItemRow = MaActionItemRowFragment;

/** The form's values; optional fields are '' when empty. `dueDate` is an ISO string. */
export interface ActionItemValues {
  title: string;
  description: string;
  assignedTo: string;
  assignedUserId: string;
  dueDate: string;
  priority: MaPriority;
  status: MaActionStatus;
}

/** What the create and update mutations take. */
export type ActionItemInput = MaActionItemInput;
