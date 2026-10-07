import { describe, expect, it } from 'vitest';
import { EmploymentStatus, Role, WorkingTime, WorkLocation } from '@/graphql/generated';
import { toFormValues, toUserInput } from '@/pages/user-forms/user';
import { makeSalary, makeUserRow } from './userFixtures';

const valid = () => toFormValues(makeUserRow(), makeSalary(), 'INR');

describe('toFormValues', () => {
  it('gives a new employee the defaults, in the company currency', () => {
    const values = toFormValues(null, null, 'EUR');

    expect(values).toMatchObject({
      name: '',
      email: '',
      password: '',
      roles: [Role.Employee],
      isActive: 'true',
      employmentStatus: EmploymentStatus.Active,
      workingTime: WorkingTime.Flexible,
      workLocation: WorkLocation.Office,
      workHoursPerDay: '8',
      timezone: '',
      country: '',
      currency: 'EUR',
      effectiveFrom: '',
    });
  });

  it("loads an existing employee's record and pay, effective from the stored date", () => {
    const values = toFormValues(makeUserRow(), makeSalary({ basic: 61000 }), 'INR');

    expect(values).toMatchObject({
      name: 'Meera Iyer',
      roles: [Role.Employee, Role.Hr],
      isActive: 'true',
      managerId: 'emp-2',
      employmentStatus: EmploymentStatus.OnLeave,
      workHoursPerDay: '8.5',
      basic: '61000',
      effectiveFrom: '2024-04-01',
      city: 'Pune',
    });
  });

  it('reads an inactive account as "false" and blank optional fields as empty strings', () => {
    const values = toFormValues(
      makeUserRow({ isActive: false, managerId: null, workingTime: null, workHoursPerDay: null }),
      null,
      'INR',
    );

    expect(values.isActive).toBe('false');
    expect(values.managerId).toBe('');
    expect(values.workingTime).toBe(WorkingTime.Flexible);
    expect(values.workHoursPerDay).toBe('8');
    // With no salary yet, the structure starts the day they joined.
    expect(values.effectiveFrom).toBe('2024-04-01');
  });
});

describe('toUserInput', () => {
  it('sends blank optional fields as null so they follow the workspace defaults', () => {
    const input = toUserInput({
      ...valid(),
      managerId: '',
      dateOfBirth: '',
      probationEndDate: '',
      timezone: '',
      locale: '',
      country: '',
      region: '',
      city: '',
    });

    expect(input).toMatchObject({
      managerId: null,
      dateOfBirth: null,
      probationEndDate: null,
      timezone: null,
      locale: null,
      country: null,
      region: null,
      city: null,
    });
  });

  it('converts the hours to a number and keeps set values as they are', () => {
    const input = toUserInput(valid());

    expect(input.workHoursPerDay).toBe(8.5);
    expect(input).toMatchObject({ managerId: 'emp-2', timezone: 'Asia/Kolkata', city: 'Pune' });
  });

  it('sends a note only for the "Other" arrangement it describes', () => {
    const notes = { workingTimeNote: 'Mon–Thu', workLocationNote: 'Client site' };

    expect(
      toUserInput({
        ...valid(),
        ...notes,
        workingTime: WorkingTime.Other,
        workLocation: WorkLocation.Other,
      }),
    ).toMatchObject(notes);
    expect(toUserInput({ ...valid(), ...notes })).toMatchObject({
      workingTimeNote: '',
      workLocationNote: '',
    });
  });
});
