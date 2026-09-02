import type { ListDepartmentsQuery } from '@exyconn/shell/graphql/generated';

export type DepartmentRow = ListDepartmentsQuery['listDepartments'][number];

export interface DepartmentFormValues {
  name: string;
  description: string;
}
