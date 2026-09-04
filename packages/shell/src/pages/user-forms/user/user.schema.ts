import { z } from 'zod';
import {
  EmploymentStatus,
  Role,
  WorkingTime,
  WorkLocation,
  type CreateUserInput,
} from '@/graphql/generated';
import { DEFAULT_WORK_HOURS } from '@/components/work';
import { compensationSchema, toCompensationValues, type EmployeeSalary } from '@/components/pay';
import type { UserRow } from './user.types';

const MIN_WORK_HOURS = 1;
const MAX_WORK_HOURS = 24;

/** Arrangements whose meaning is written out in a note rather than named by the enum. */
const NEEDS_NOTE = 'OTHER';

const identitySchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().refine((v) => !v || v.length >= 6, 'Minimum 6 characters'),
    roles: z.array(z.nativeEnum(Role)).min(1, 'Select at least one role'),
    isActive: z.enum(['true', 'false']),
    avatarUrl: z.string(),
    address: z.string().trim(),
    brief: z.string().trim().max(600, 'Keep the brief under 600 characters'),
    department: z.string().trim().min(1, 'Department is required'),
    designation: z.string().trim().min(1, 'Designation is required'),
    joinDate: z.string().min(1, 'Join date is required'),
    dateOfBirth: z.string(),
    employmentStatus: z.nativeEnum(EmploymentStatus),
    workingTime: z.nativeEnum(WorkingTime),
    workingTimeNote: z.string().trim(),
    workLocation: z.nativeEnum(WorkLocation),
    workLocationNote: z.string().trim(),
    workHoursPerDay: z
      .string()
      .min(1, 'Working hours are required')
      .refine((v) => {
        const hours = Number(v);
        return Number.isFinite(hours) && hours >= MIN_WORK_HOURS && hours <= MAX_WORK_HOURS;
      }, `Enter between ${MIN_WORK_HOURS} and ${MAX_WORK_HOURS} hours`),
  })
  // "Other" is only meaningful with a description — an arrangement nobody wrote down is
  // exactly the one the tracker and payroll will later disagree about.
  .refine((v) => v.workingTime !== NEEDS_NOTE || v.workingTimeNote !== '', {
    path: ['workingTimeNote'],
    message: 'Describe the working-time arrangement',
  })
  .refine((v) => v.workLocation !== NEEDS_NOTE || v.workLocationNote !== '', {
    path: ['workLocationNote'],
    message: 'Describe the work location',
  });

/**
 * The whole employee record: who they are, how they work, and how they are paid.
 *
 * Compensation is merged in rather than kept as a separate form because it is saved in the
 * same submit — an employee created without a pay type is one payroll and the tracker's
 * billing report both have nothing to say about.
 */
export const userSchema = z.intersection(identitySchema, compensationSchema);

export type UserValues = z.infer<typeof userSchema>;

/** Form defaults for a new employee, or the stored values of an existing one. */
export function toFormValues(
  row: UserRow | null,
  salary: EmployeeSalary | null = null,
): UserValues {
  return {
    ...toCompensationValues(salary, row?.joinDate),
    name: row?.name ?? '',
    email: row?.email ?? '',
    password: '',
    roles: row?.roles ?? [Role.Employee],
    isActive: row?.isActive === false ? 'false' : 'true',
    avatarUrl: row?.avatarUrl ?? '',
    address: row?.address ?? '',
    brief: row?.brief ?? '',
    department: row?.department ?? '',
    designation: row?.designation ?? '',
    joinDate: row?.joinDate ?? '',
    dateOfBirth: row?.dateOfBirth ?? '',
    employmentStatus: row?.employmentStatus ?? EmploymentStatus.Active,
    workingTime: row?.workingTime ?? WorkingTime.Flexible,
    workingTimeNote: row?.workingTimeNote ?? '',
    workLocation: row?.workLocation ?? WorkLocation.Office,
    workLocationNote: row?.workLocationNote ?? '',
    workHoursPerDay: String(row?.workHoursPerDay ?? DEFAULT_WORK_HOURS),
  };
}

/**
 * The profile and employment half of the GraphQL input.
 *
 * The two notes are only sent for the arrangement they describe: switching someone from
 * "Other" to "Office" must clear the sentence that explained the old arrangement, not leave
 * it on the record contradicting the new one.
 */
export function toUserInput(v: UserValues): Omit<CreateUserInput, 'name' | 'email' | 'roles'> {
  return {
    avatarUrl: v.avatarUrl,
    address: v.address,
    brief: v.brief,
    department: v.department,
    designation: v.designation,
    joinDate: v.joinDate,
    dateOfBirth: v.dateOfBirth || null,
    employmentStatus: v.employmentStatus,
    workingTime: v.workingTime,
    workingTimeNote: v.workingTime === NEEDS_NOTE ? v.workingTimeNote : '',
    workLocation: v.workLocation,
    workLocationNote: v.workLocation === NEEDS_NOTE ? v.workLocationNote : '',
    workHoursPerDay: Number(v.workHoursPerDay),
  };
}
