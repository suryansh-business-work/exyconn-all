import type {
  IncidentImpact,
  StatusIncidentFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type IncidentRow = StatusIncidentFieldsFragment;

/** What opening an incident by hand collects; the body becomes the first update. */
export interface IncidentFormValues {
  title: string;
  impact: IncidentImpact;
  affectedServiceKeys: string[];
  body: string;
}

export interface IncidentFormProps {
  onDone: () => void;
  onCancel: () => void;
}
