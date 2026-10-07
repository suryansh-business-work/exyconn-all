import { EmploymentStatus, Role } from '@/graphql/generated';
import type { UserDetail } from '@/pages/UserDetails/user-details.types';

/** A fully-loaded user record with the facts a profile shows; override what a test needs. */
export function makeUserDetail(patch: Partial<UserDetail> = {}): UserDetail {
  return {
    id: 'emp-1',
    name: 'Meera Nair',
    email: 'meera@example.com',
    roles: [Role.Employee],
    avatarUrl: null,
    isActive: true,
    isBlocked: false,
    blockReason: null,
    department: 'Engineering',
    designation: 'Engineer',
    managerName: 'Ravi Kumar',
    employmentStatus: EmploymentStatus.Active,
    joinDate: '2024-01-15T00:00:00.000Z',
    probationEndDate: null,
    phone: '+911234567890',
    lastActiveAt: null,
    isOnline: false,
    address: null,
    brief: null,
    workingTime: null,
    workingTimeNote: null,
    workLocation: null,
    workLocationNote: null,
    workHoursPerDay: 8,
    socialLinks: null,
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-02-10T00:00:00.000Z',
    ...patch,
  };
}
