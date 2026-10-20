import { describe, expect, it } from 'vitest';
import { WorkingTime, WorkLocation } from '@/graphql/generated';
import { toFormValues, userSchema } from '@/pages/user-forms/user';
import { toUserInput } from '@/pages/user-forms/user/user.schema';
import { makeSalary, makeUserRow } from './userFixtures';

/** The first message a failed parse reports for each field, as a form would show it. */
function errorsOf(values: unknown): Record<string, string> {
  const result = userSchema.safeParse(values);
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

const valid = () => toFormValues(makeUserRow(), makeSalary(), 'INR');

describe('the personal email', () => {
  it('may be left empty, but anything typed must be an address', () => {
    expect(errorsOf({ ...valid(), personalEmail: '' }).personalEmail).toBeUndefined();
    expect(
      errorsOf({ ...valid(), personalEmail: 'me@home.example' }).personalEmail,
    ).toBeUndefined();
    expect(errorsOf({ ...valid(), personalEmail: 'not an address' }).personalEmail).toBe(
      'Enter a valid email',
    );
  });

  it('is stored as null when empty, and as typed otherwise', () => {
    const empty = userSchema.parse({ ...valid(), personalEmail: '' });
    const given = userSchema.parse({ ...valid(), personalEmail: 'me@home.example' });
    expect(toUserInput(empty).personalEmail).toBeNull();
    expect(toUserInput(given).personalEmail).toBe('me@home.example');
  });
});

describe('the work week', () => {
  it('follows the company week (null) when no day is picked, else keeps the days', () => {
    expect(toUserInput(userSchema.parse({ ...valid(), workDays: [] })).workDays).toBeNull();
    expect(toUserInput(userSchema.parse({ ...valid(), workDays: [1, 2, 3] })).workDays).toEqual([
      1, 2, 3,
    ]);
  });
});

describe('userSchema', () => {
  it('accepts a complete record', () => {
    expect(errorsOf(valid())).toEqual({});
  });

  it('requires the identity and placement basics', () => {
    const errors = errorsOf({
      ...valid(),
      name: ' ',
      email: '',
      roles: [],
      department: '',
      designation: '',
      joinDate: '',
      workHoursPerDay: '',
    });

    expect(errors).toMatchObject({
      name: 'Name is required',
      email: 'Email is required',
      roles: 'Select at least one role',
      department: 'Department is required',
      designation: 'Designation is required',
      joinDate: 'Join date is required',
      workHoursPerDay: 'Working hours are required',
    });
  });

  it('checks the email shape, the password length and the brief length', () => {
    expect(errorsOf({ ...valid(), email: 'meera@' }).email).toBe('Enter a valid email');
    expect(errorsOf({ ...valid(), password: '12345' }).password).toBe('Minimum 6 characters');
    expect(errorsOf({ ...valid(), password: '' }).password).toBeUndefined();
    expect(errorsOf({ ...valid(), brief: 'x'.repeat(601) }).brief).toBe(
      'Keep the brief under 600 characters',
    );
    expect(errorsOf({ ...valid(), city: 'x'.repeat(101) }).city).toBe(
      'Keep the city under 100 characters',
    );
    expect(errorsOf({ ...valid(), region: 'x'.repeat(101) }).region).toBe(
      'Keep the state or region under 100 characters',
    );
  });

  it('keeps working hours between 1 and 24', () => {
    const message = 'Enter between 1 and 24 hours';
    for (const hours of ['0.5', '24.5', 'eight']) {
      expect(errorsOf({ ...valid(), workHoursPerDay: hours }).workHoursPerDay).toBe(message);
    }
    for (const hours of ['1', '24']) {
      expect(errorsOf({ ...valid(), workHoursPerDay: hours }).workHoursPerDay).toBeUndefined();
    }
  });

  it('accepts only a listed timezone, language and country, or blank', () => {
    const errors = errorsOf({
      ...valid(),
      timezone: 'Mars/Base',
      locale: 'not a locale!!',
      country: '1N',
    });

    expect(errors).toMatchObject({
      timezone: 'Choose a timezone from the list',
      locale: 'Choose a language',
      country: 'Choose a country',
    });
    expect(errorsOf({ ...valid(), timezone: '', locale: '', country: '' })).toEqual({});
  });

  it('requires a note for an "Other" working time or work location', () => {
    const errors = errorsOf({
      ...valid(),
      workingTime: WorkingTime.Other,
      workLocation: WorkLocation.Other,
    });

    expect(errors).toMatchObject({
      workingTimeNote: 'Describe the working-time arrangement',
      workLocationNote: 'Describe the work location',
    });
  });
});
