import type { ListGradesPagedQuery } from '@exyconn/shell/graphql/generated';

export type GradeRow = ListGradesPagedQuery['listGradesPaged']['rows'][number];

export interface GradeFormValues {
  name: string;
  code: string;
  level: number | string;
  minSalary: number | string;
  maxSalary: number | string;
  active: string;
}
