import { EmploymentStatus, PayType, Role, WorkingTime, WorkLocation } from '@/graphql/generated';
import type { EmployeeSalary } from '@/components/pay';
import type { UserRow } from '@/pages/user-forms/user';

/** A complete, valid employee record; a test overrides only the fields it is about. */
export function makeUserRow(patch: Partial<UserRow> = {}): UserRow {
  return {
    id: 'emp-1',
    name: 'Meera Iyer',
    email: 'meera@acme.test',
    roles: [Role.Employee, Role.Hr],
    avatarUrl: 'https://img.test/meera.png',
    isActive: true,
    isBlocked: false,
    blockReason: null,
    department: 'People',
    designation: 'HR Partner',
    locationCode: 'PUN',
    teamName: 'Talent',
    gradeCode: 'G4',
    employmentTypeCode: 'FT',
    shiftCode: 'DAY',
    joinDate: '2024-04-01',
    dateOfBirth: '1990-08-15',
    probationEndDate: '2024-10-01',
    employmentStatus: EmploymentStatus.OnLeave,
    address: '12 MG Road, Pune',
    brief: 'Runs hiring for engineering.',
    managerId: 'emp-2',
    managerName: 'Ravi Kumar',
    workingTime: WorkingTime.Fixed,
    workingTimeNote: '',
    workLocation: WorkLocation.Hybrid,
    workLocationNote: '',
    workHoursPerDay: 8.5,
    timezone: 'Asia/Kolkata',
    locale: 'en',
    country: 'IN',
    region: 'Maharashtra',
    city: 'Pune',
    ...patch,
  };
}

export function makeSalary(patch: Partial<EmployeeSalary> = {}): EmployeeSalary {
  return {
    __typename: 'SalaryStructure',
    id: 'sal-1',
    employeeId: 'emp-1',
    currency: 'INR',
    payType: PayType.Fixed,
    payTypeNote: '',
    basic: 50000,
    hra: 20000,
    allowances: 5000,
    deductions: 1000,
    rate: 0,
    billingRate: 1500,
    gross: 75000,
    net: 74000,
    pfApplicable: true,
    esiApplicable: false,
    tdsPercent: 0,
    taxRegimeKey: null,
    taxExempt: false,
    pfNumber: null,
    esiNumber: null,
    panNumber: null,
    effectiveFrom: '2024-04-01',
    ...patch,
  };
}
