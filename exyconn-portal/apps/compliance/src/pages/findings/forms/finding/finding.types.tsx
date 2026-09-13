import type { FindingFieldsFragment } from '@exyconn/shell/graphql/generated';

export type FindingRow = FindingFieldsFragment;

export interface FindingFormValues {
  title: string;
  description: string;
  source: string;
  auditId: string;
  riskId: string;
  standards: string[];
  category: string;
  clause: string;
  type: string;
  immediateAction: string;
  rootCause: string;
  correctiveAction: string;
  ownerId: string;
  ownerName: string;
  raisedOn: Date | null;
  dueOn: Date | null;
  status: string;
  verifiedOn: Date | null;
  verifiedByName: string;
  effective: string;
  effectivenessNote: string;
}
