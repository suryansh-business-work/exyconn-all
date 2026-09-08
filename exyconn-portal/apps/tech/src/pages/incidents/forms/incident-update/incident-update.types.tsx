import type { IncidentUpdateStatus } from '@exyconn/shell/graphql/generated';

/** The incident being narrated — only what the form shows and sends. */
export interface UpdatedIncident {
  id: string;
  title: string;
  resolvedAt?: string | null;
}

export interface IncidentUpdateFormValues {
  status: IncidentUpdateStatus;
  body: string;
}

export interface IncidentUpdateFormProps {
  incident: UpdatedIncident;
  onDone: () => void;
  onCancel: () => void;
}
