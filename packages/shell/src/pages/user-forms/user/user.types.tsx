import type {
  ListUsersQuery,
  Role,
  EmploymentStatus,
  WorkingTime,
  WorkLocation,
} from '@/graphql/generated';

export type UserRow = ListUsersQuery['listUsers'][number];

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  roles: Role[];
  isActive: 'true' | 'false';
  avatarUrl: string;
  address: string;
  brief: string;
  department: string;
  designation: string;
  joinDate: string;
  dateOfBirth: string;
  employmentStatus: EmploymentStatus;
  workingTime: WorkingTime;
  workingTimeNote: string;
  workLocation: WorkLocation;
  workLocationNote: string;
  /** Kept as a string because the number input's empty state is '' , not 0. */
  workHoursPerDay: string;
}
