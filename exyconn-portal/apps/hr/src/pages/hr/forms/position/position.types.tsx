import type { PositionFieldsFragment } from '@exyconn/shell/graphql/generated';

export type PositionRow = PositionFieldsFragment;

export interface PositionFormValues {
  name: string;
  department: string;
  code: string;
  description: string;
  minSalary: number;
  maxSalary: number;
  grade: string;
  employmentType: string;
  headcount: number;
  active: boolean;
}
