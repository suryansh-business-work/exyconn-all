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
  /** The user this person reports to; '' when nobody is set. */
  managerId: string;
  designation: string;
  /** Office or site, by the location master's code; '' when not placed. */
  locationCode: string;
  /** Team inside the department, by name; '' when not placed. */
  teamName: string;
  /** Job grade, by code; '' when not set. */
  gradeCode: string;
  /** Kind of employment, by code; '' when not set. */
  employmentTypeCode: string;
  /** Working-hours pattern, by code; '' when not set. */
  shiftCode: string;
  joinDate: string;
  dateOfBirth: string;
  /** The day they come off probation; '' when they are not on one. */
  probationEndDate: string;
  employmentStatus: EmploymentStatus;
  workingTime: WorkingTime;
  workingTimeNote: string;
  workLocation: WorkLocation;
  workLocationNote: string;
  /** Kept as a string because the number input's empty state is '' , not 0. */
  workHoursPerDay: string;
  /** IANA zone name; '' follows the workspace default. */
  timezone: string;
  /** BCP-47 tag; '' follows the workspace default. */
  locale: string;
  /** ISO 3166-1 alpha-2; '' follows the company's country. */
  country: string;
  /** The state or region they work in; '' when not set. */
  region: string;
  /** The city they work in; '' when not set. */
  city: string;
}
