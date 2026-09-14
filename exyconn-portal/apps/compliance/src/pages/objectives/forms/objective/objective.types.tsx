import type { ObjectiveFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ObjectiveRow = ObjectiveFieldsFragment;

export interface ObjectiveFormValues {
  title: string;
  description: string;
  standards: string[];
  category: string;
  scope: string;
  area: string;
  ownerId: string;
  ownerName: string;
  measure: string;
  unit: string;
  baseline: number;
  target: number;
  actual: number;
  frequency: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  status: string;
  plan: string;
}
