import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkingTime, WorkLocation } from '@/graphql/generated';
import {
  EmploymentFields,
  ProfileFields,
  WorkArrangementFields,
} from '@/pages/user-forms/user/user.fields';
import { toFormValues } from '@/pages/user-forms/user';
import type { UserRow } from '@/pages/user-forms/user';
import { renderWithProviders } from '../../../test-utils';
import { FORM_TIMEOUT, SLOW } from '../slow';
import { FormHarness, formValues } from '../../../components/form/formHarness';
import { makeUserRow } from './userFixtures';

const POSITIONS = [
  { name: 'HR Partner', department: 'People', active: true },
  { name: 'Recruiter', department: 'People', active: true },
  { name: 'Payroll Lead', department: 'People', active: false },
  { name: 'HR Partner', department: 'Finance', active: true },
  { name: 'Accountant', department: 'Finance', active: true },
];
const DEPARTMENTS = [
  { value: 'People', label: 'People' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Sales', label: 'Sales' },
];

function renderEmployment(row: Partial<UserRow>, departments = DEPARTMENTS, current?: string) {
  return renderWithProviders(
    <FormHarness defaultValues={toFormValues(makeUserRow(row), null, 'INR')}>
      <EmploymentFields
        departmentOptions={departments}
        positions={POSITIONS}
        currentDesignation={current}
        managerOptions={[{ value: 'emp-2', label: 'Ravi Kumar — Head of People' }]}
      />
    </FormHarness>,
  );
}

/** Opens a select and reads its options, then closes it again. */
async function optionsOf(label: string): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  const listbox = await screen.findByRole('listbox', {}, SLOW);
  const names = within(listbox)
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');
  await userEvent.keyboard('{Escape}');
  return names;
}

async function choose(label: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }, SLOW));
}

describe('EmploymentFields', () => {
  it(
    "offers the department's open positions plus the saved designation",
    async () => {
      renderEmployment(
        { department: 'People', designation: 'Payroll Lead' },
        DEPARTMENTS,
        'Payroll Lead',
      );

      expect(await optionsOf('Designation')).toEqual(['HR Partner', 'Recruiter', 'Payroll Lead']);
      expect(screen.getByRole('combobox', { name: 'Reports to (manager)' })).toHaveValue(
        'Ravi Kumar — Head of People',
      );
    },
    FORM_TIMEOUT,
  );

  it(
    'asks for departments when HR has created none, and for a department first',
    () => {
      renderEmployment({ department: '', designation: '' }, []);

      expect(screen.getByText('Add departments in HR → Departments first.')).toBeInTheDocument();
      expect(screen.getByText('Choose a department first.')).toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'points to HR when the chosen department has no open positions',
    () => {
      renderEmployment({ department: 'Sales', designation: '' });

      expect(
        screen.getByText('Add positions to this department in HR → Departments.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Add departments in HR → Departments first.'),
      ).not.toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'keeps the saved designation on first render, and when the new department has it',
    async () => {
      renderEmployment({ department: 'People', designation: 'HR Partner' });
      expect(formValues().designation).toBe('HR Partner');

      await choose('Department', 'Finance');

      await waitFor(() => expect(formValues().department).toBe('Finance'), SLOW);
      expect(formValues().designation).toBe('HR Partner');
    },
    FORM_TIMEOUT,
  );

  it(
    'clears a designation the new department does not have',
    async () => {
      renderEmployment({ department: 'People', designation: 'Recruiter' });

      await choose('Department', 'Finance');

      await waitFor(() => expect(formValues().designation).toBe(''), SLOW);
      expect(await optionsOf('Designation')).toEqual(['HR Partner', 'Accountant']);
    },
    FORM_TIMEOUT,
  );
});

describe('WorkArrangementFields', () => {
  function renderArrangement(workingTime: WorkingTime, workLocation: WorkLocation) {
    renderWithProviders(
      <FormHarness
        defaultValues={toFormValues(makeUserRow({ workingTime, workLocation }), null, 'INR')}
      >
        <WorkArrangementFields />
      </FormHarness>,
    );
  }

  it(
    'asks for the hours and locale, but no notes, for named arrangements',
    () => {
      renderArrangement(WorkingTime.Fixed, WorkLocation.Office);

      expect(screen.getByLabelText('Working hours per day')).toHaveAttribute('max', '24');
      expect(screen.getByText(/Defaults to 8 — the desktop tracker/)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Timezone' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Working-time arrangement')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Work location detail')).not.toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );

  it(
    'asks for a note under each arrangement set to "Other"',
    () => {
      renderArrangement(WorkingTime.Other, WorkLocation.Other);

      expect(screen.getByLabelText('Working-time arrangement')).toBeInTheDocument();
      expect(screen.getByLabelText('Work location detail')).toBeInTheDocument();
    },
    FORM_TIMEOUT,
  );
});

describe('ProfileFields', () => {
  it(
    'asks for the photo, address and brief',
    () => {
      renderWithProviders(
        <FormHarness defaultValues={toFormValues(makeUserRow(), null, 'INR')}>
          <ProfileFields />
        </FormHarness>,
      );

      expect(screen.getByText('Photo')).toBeInTheDocument();
      expect(screen.getByLabelText('Address')).toHaveValue('12 MG Road, Pune');
      expect(screen.getByLabelText('Brief')).toHaveValue('Runs hiring for engineering.');
    },
    FORM_TIMEOUT,
  );
});
