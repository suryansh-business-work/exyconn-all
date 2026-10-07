import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { Role } from '@/graphql/generated';
import { UserForm } from '@/pages/user-forms/user';
import type { UserRow } from '@/pages/user-forms/user';
import { renderWithProviders } from '../../../test-utils';
import { FORM_TIMEOUT, SLOW } from '../slow';
import type { MutationOverride } from '../mutationOverride';
import { makeSalary, makeUserRow } from './userFixtures';
import {
  captured,
  directoryMocks,
  salaryQueryMock,
  saveSalaryMock,
  updateUserMock,
} from './userFormMocks';

const override = vi.hoisted((): MutationOverride => ({ mutate: null }));

vi.mock('@/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/graphql/generated')>();
  const { withOverride } = await import('../mutationOverride');
  return { ...actual, useUpdateUserMutation: withOverride(override, actual.useUpdateUserMutation) };
});

function renderEdit(mocks: MockLink.MockedResponse[], row: UserRow = makeUserRow()) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<UserForm initial={row} onDone={onDone} onCancel={onCancel} />, {
    mocks: [...directoryMocks(), ...mocks],
  });
  return { onDone, onCancel };
}

const update = () => screen.findByRole('button', { name: 'Update' }, SLOW);

describe('UserForm — editing an employee', () => {
  it(
    'waits for their compensation, then saves the record and the pay',
    async () => {
      const user = captured();
      const salary = captured();
      const { onDone } = renderEdit([
        salaryQueryMock(makeSalary({ basic: 61000 }), 20),
        updateUserMock(user.match),
        saveSalaryMock(salary.match),
      ]);

      expect(screen.getByLabelText('Loading compensation')).toBeInTheDocument();
      expect(await screen.findByLabelText('New password (optional)', {}, SLOW)).toHaveValue('');
      expect(
        screen.getByText('The same roles the Admin console shows — this is one user record.'),
      ).toBeInTheDocument();

      await userEvent.click(await update());

      expect(await screen.findByText('User updated', {}, SLOW)).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(user.calls[0]).toMatchObject({
        id: 'emp-1',
        input: {
          name: 'Meera Iyer',
          email: 'meera@acme.test',
          roles: [Role.Employee, Role.Hr],
          isActive: true,
          managerId: 'emp-2',
          workHoursPerDay: 8.5,
        },
      });
      expect(user.calls[0].input).not.toHaveProperty('password');
      expect(salary.calls[0]).toMatchObject({ employeeId: 'emp-1', input: { basic: 61000 } });
    },
    FORM_TIMEOUT,
  );

  it(
    'sends a new password only when one is typed, and an inactive account as such',
    async () => {
      const user = captured();
      const newSecret = ['fresh', 'secret', String(Date.now())].join('-');
      renderEdit(
        [salaryQueryMock(makeSalary()), updateUserMock(user.match), saveSalaryMock(() => true)],
        makeUserRow({ isActive: false }),
      );

      fireEvent.change(await screen.findByLabelText('New password (optional)'), {
        target: { value: newSecret },
      });
      await userEvent.click(await update());

      await screen.findByText('User updated', {}, SLOW);
      expect(user.calls[0]).toMatchObject({ input: { password: newSecret, isActive: false } });
    },
    FORM_TIMEOUT,
  );

  it(
    'offers every manager but the person being edited, and keeps a retired department',
    async () => {
      renderEdit(
        [salaryQueryMock(null)],
        makeUserRow({ department: 'Legacy Ops', designation: 'Clerk' }),
      );

      const manager = await screen.findByRole('combobox', { name: 'Reports to (manager)' }, SLOW);
      await userEvent.click(manager);
      const managers = within(await screen.findByRole('listbox', {}, SLOW)).getAllByRole('option');
      expect(managers.map((option) => option.textContent)).toEqual([
        'Ravi Kumar — Head of People',
        'Sara Das',
      ]);
      await userEvent.keyboard('{Escape}');

      await userEvent.click(screen.getByRole('combobox', { name: 'Department' }));
      const departments = within(await screen.findByRole('listbox', {}, SLOW)).getAllByRole(
        'option',
      );
      expect(departments.map((option) => option.textContent)).toEqual([
        'People',
        'Finance',
        'Legacy Ops',
      ]);
    },
    FORM_TIMEOUT,
  );

  it(
    "shows the server's error, keeps the form open and saves no pay",
    async () => {
      const salary = captured();
      const { onDone } = renderEdit([
        salaryQueryMock(makeSalary()),
        updateUserMock(() => true, new Error('Email already in use')),
        saveSalaryMock(salary.match),
      ]);

      await userEvent.click(await update());

      expect(await screen.findByText('Email already in use', {}, SLOW)).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
      expect(salary.calls).toHaveLength(0);
    },
    FORM_TIMEOUT,
  );

  it(
    'falls back to "Save failed" for a failure that carries no message',
    async () => {
      override.mutate = vi.fn().mockRejectedValue({ code: 500 });
      try {
        const { onDone } = renderEdit([salaryQueryMock(makeSalary())]);

        await userEvent.click(await update());

        expect(await screen.findByText('Save failed', {}, SLOW)).toBeInTheDocument();
        expect(onDone).not.toHaveBeenCalled();
      } finally {
        override.mutate = null;
      }
    },
    FORM_TIMEOUT,
  );

  it(
    'does not save a record that fails validation, here with no name and no basic salary',
    async () => {
      const user = captured();
      renderEdit([salaryQueryMock(null), updateUserMock(user.match)], makeUserRow({ name: '' }));

      await userEvent.click(await update());

      expect(await screen.findByText('Name is required', {}, SLOW)).toBeInTheDocument();
      expect(screen.getByText('Enter the basic salary')).toBeInTheDocument();
      await waitFor(() => expect(user.calls).toHaveLength(0));
    },
    FORM_TIMEOUT,
  );
});
