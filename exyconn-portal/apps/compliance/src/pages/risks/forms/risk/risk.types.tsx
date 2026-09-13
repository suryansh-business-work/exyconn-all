import type { RiskFieldsFragment } from '@exyconn/shell/graphql/generated';

export type RiskRow = RiskFieldsFragment;

export interface RiskFormValues {
  title: string;
  description: string;
  standards: string[];
  category: string;
  subject: string;
  ownerId: string;
  ownerName: string;
  likelihood: string;
  impact: string;
  treatment: string;
  controls: string;
  residualLikelihood: string;
  residualImpact: string;
  status: string;
  identifiedOn: Date | null;
  reviewDueOn: Date | null;
}
