import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { Role } from '@/graphql/generated';
import { UserForm } from '@/pages/user-forms/user';
import { renderWithProviders } from '../../../test-utils';
import { FORM_TIMEOUT, SLOW } from '../slow';
import { captured, createUserMock, directoryMocks, saveSalaryMock } from './userFormMocks';

type OnCreated = (creds: { name: string; email: string; password: string }) => void;

function renderCreate(mocks: MockLink.MockedResponse[], onCreated?: OnCreated) {
  const onDone = vi.fn();
  renderWithProviders(
    <UserForm initial={null} onDone={onDone} onCancel={vi.fn()} onCreated={onCreated} />,
    { mocks: [...directoryMocks(), ...mocks] },
  );
  return { onDone };
}

const input = (name: string) => {
  const element = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!element) throw new Error(`No input named ${name}`);
  return element;
};

async function choose(label: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }, SLOW));
}

/** Fills the fields a new employee cannot be saved without, then submits. */
async function fillAndCreate() {
  fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Kiran Rao' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'kiran@acme.test' } });
  await choose('Department', 'People');
  await choose('Designation', 'HR Partner');
  fireEvent.change(input('joinDate'), { target: { value: '04/15/2026' } });
  fireEvent.change(input('effectiveFrom'), { target: { value: '04/15/2026' } });
  // The test workspace has no company currency, so it is picked by hand.
  fireEvent.change(screen.getByRole('combobox', { name: 'Currency' }), {
    target: { value: 'Indian Rupee' },
  });
  await userEvent.click(await screen.findByRole('option', { name: /Indian Rupee/ }, SLOW));
  fireEvent.change(screen.getByLabelText('Basic'), { target: { value: '42000' } });
  await userEvent.click(screen.getByRole('button', { name: 'Create' }));
}

describe('UserForm — creating an employee', () => {
  it(
    'creates the account, reveals the one-time credentials and saves the pay against it',
    async () => {
      const user = captured();
      const salary = captured();
      const oneTime = ['temp', String(Date.now())].join('-');
      const onCreated = vi.fn();
      const { onDone } = renderCreate(
        [createUserMock(user.match, oneTime), saveSalaryMock(salary.match)],
        onCreated,
      );

      expect(
        screen.getByText('A temporary password will be emailed to the user.'),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('New password (optional)')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Loading compensation')).not.toBeInTheDocument();

      await fillAndCreate();

      expect(
        await screen.findByText('User created — credentials emailed', {}, SLOW),
      ).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onCreated).toHaveBeenCalledWith({
        name: 'Kiran Rao',
        email: 'kiran@acme.test',
        password: oneTime,
      });
      expect(user.calls[0]).toMatchObject({
        input: {
          name: 'Kiran Rao',
          email: 'kiran@acme.test',
          roles: [Role.Employee],
          isActive: true,
          department: 'People',
          designation: 'HR Partner',
          managerId: null,
        },
      });
      expect(user.calls[0].input).not.toHaveProperty('password');
      expect(salary.calls[0]).toMatchObject({
        employeeId: 'emp-9',
        input: { basic: 42000, currency: 'INR' },
      });
    },
    FORM_TIMEOUT,
  );

  it(
    'creates without a credentials callback',
    async () => {
      const salary = captured();
      const { onDone } = renderCreate([
        createUserMock(() => true, ['temp', 'value'].join('-')),
        saveSalaryMock(salary.match),
      ]);

      await fillAndCreate();

      expect(
        await screen.findByText('User created — credentials emailed', {}, SLOW),
      ).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(salary.calls).toHaveLength(1);
    },
    FORM_TIMEOUT,
  );

  it(
    'saves no pay and reveals nothing when the create answers with no account',
    async () => {
      const salary = captured();
      const onCreated = vi.fn();
      const { onDone } = renderCreate(
        [createUserMock(() => true, null), saveSalaryMock(salary.match)],
        onCreated,
      );

      await fillAndCreate();

      expect(
        await screen.findByText('User created — credentials emailed', {}, SLOW),
      ).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onCreated).not.toHaveBeenCalled();
      expect(salary.calls).toHaveLength(0);
    },
    FORM_TIMEOUT,
  );
});
