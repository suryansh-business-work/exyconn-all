import type { ListUsersQuery, Role, EmploymentStatus } from '@/graphql/generated';

export type UserRow = ListUsersQuery['listUsers'][number];

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  roles: Role[];
  isActive: 'true' | 'false';
  department: string;
  designation: string;
  joinDate: string;
  employmentStatus: EmploymentStatus;
}
