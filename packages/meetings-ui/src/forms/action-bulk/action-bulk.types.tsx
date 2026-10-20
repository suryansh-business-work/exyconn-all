import type {
  MaActionStatus,
  MaBulkActionInput,
  MaPriority,
} from '@exyconn/shell/graphql/generated';

/** What to set on every selected item; '' leaves that field as it is. */
export interface ActionBulkValues {
  status: MaActionStatus | '';
  priority: MaPriority | '';
}

export type ActionBulkInput = MaBulkActionInput;
