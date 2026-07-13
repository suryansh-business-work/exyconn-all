import type { ListDepartmentsQuery } from '../../../../../graphql/generated';

export type DepartmentRow = ListDepartmentsQuery['listDepartments'][number];

export interface DepartmentFormValues {
  name: string;
  description: string;
}
