import type { StatusMaintenanceFieldsFragment } from '@exyconn/shell/graphql/generated';

export type MaintenanceRow = StatusMaintenanceFieldsFragment;

/** Dates travel as ISO strings — what the date-time picker stores. */
export interface MaintenanceFormValues {
  title: string;
  body: string;
  affectedServiceKeys: string[];
  startsAt: string;
  endsAt: string;
}

export interface MaintenanceFormProps {
  initial: MaintenanceRow | null;
  onDone: () => void;
  onCancel: () => void;
}
