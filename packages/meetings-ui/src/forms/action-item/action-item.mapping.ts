import { MaActionStatus, MaPriority } from '@exyconn/shell/graphql/generated';
import type { ActionItemInput, ActionItemRow, ActionItemValues } from './action-item.types';

/** The row being edited as form values, or a fresh item's defaults. */
export function toActionValues(row: ActionItemRow | null): ActionItemValues {
  return {
    title: row?.title ?? '',
    description: row?.description ?? '',
    assignedTo: row?.assignedTo ?? '',
    assignedUserId: row?.assignedUserId ?? '',
    dueDate: row?.dueDate ?? '',
    priority: row?.priority ?? MaPriority.Medium,
    status: row?.status ?? MaActionStatus.Pending,
  };
}

/** The values as the server takes them: an empty optional field is null, not ''. */
export function toActionInput(values: ActionItemValues): ActionItemInput {
  return {
    title: values.title,
    description: values.description,
    assignedTo: values.assignedTo || null,
    assignedUserId: values.assignedUserId || null,
    dueDate: values.dueDate || null,
    priority: values.priority,
    status: values.status,
  };
}
