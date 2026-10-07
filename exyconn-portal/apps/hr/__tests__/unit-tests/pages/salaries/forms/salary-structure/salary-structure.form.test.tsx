import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayType } from '@exyconn/shell/graphql/generated';
import {
  SalaryStructureForm,
  type SalaryStructureRow,
} from '../../../../../../src/pages/salaries/forms/salary-structure';
import { renderWithProviders } from '../../../../test-utils';
import { USERS, localIso, pickDate, pickOption, press, setNumber } from '../../../../harness/forms';

const gql = vi.hoisted(() => ({ save: vi.fn(), users: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveEmployeeSalaryMutation: () => [gql.save],
  useListUsersQuery: () => gql.users(),
  // The tax regime picker reads the regimes on file; one is enough here.
  useTaxRegimeChoicesQuery: () => ({
    data: { taxRegimeChoices: [{ regimeKey: 'NEW', name: 'New regime', active: true }] },
    error: undefined,
  }),
}));

const ROW: SalaryStructureRow = {
  id: 'salary-1',
  employeeId: 'user-2',
  currency: 'INR',
  payType: PayType.Fixed,
  payTypeNote: null,
  basic: 60000,
  hra: 24000,
  allowances: 6000,
  deductions: 1800,
  rate: 0,
  billingRate: 1500,
  gross: 90000,
  net: 88200,
  pfApplicable: true,
  esiApplicable: false,
  tdsPercent: 0,
  taxRegimeKey: 'NEW',
  taxExempt: false,
  effectiveFrom: '2026-04-01T00:00:00.000Z',
};

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: SalaryStructureRow | null = null) =>
  renderWithProviders(
    <SalaryStructureForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );

describe('SalaryStructureForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    gql.users.mockReset().mockReturnValue({ data: { listUsers: USERS } });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('saves a fixed salary for the picked employee under the company tax default', async () => {
    renderForm();
    await pickOption('Employee', 'Asha Rao (asha@example.com)');
    await userEvent.type(screen.getByRole('combobox', { name: 'Currency' }), 'INR');
    await userEvent.click(await screen.findByRole('option', { name: /\(INR\)$/ }));
    setNumber('Basic', '50000');
    setNumber('HRA', '20000');
    pickDate('effectiveFrom', '04/01/2026');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        employeeId: 'user-1',
        input: {
          currency: 'INR',
          payType: PayType.Fixed,
          payTypeNote: '',
          basic: 50000,
          hra: 20000,
          allowances: 0,
          deductions: 0,
          rate: 0,
          billingRate: 0,
          taxExempt: false,
          taxRegimeKey: null,
          effectiveFrom: localIso(2026, 3, 1),
        },
      },
    });
    expect(await screen.findByText('Salary saved')).toBeInTheDocument();
  });

  it('updates the structure of the employee it belongs to, keeping their regime', async () => {
    renderForm(ROW);
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue(
      'Bo Chen (bo@example.com)',
    );
    setNumber('Basic', '65000');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        employeeId: 'user-2',
        input: expect.objectContaining({
          currency: 'INR',
          basic: 65000,
          hra: 24000,
          allowances: 6000,
          deductions: 1800,
          billingRate: 1500,
          taxExempt: false,
          taxRegimeKey: 'NEW',
          effectiveFrom: '2026-04-01T00:00:00.000Z',
        }),
      },
    });
    expect(await screen.findByText('Salary updated')).toBeInTheDocument();
  });

  it('asks whose salary it is, in what currency and from when, before anything is sent', async () => {
    renderForm();
    await press('Create');

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(screen.getByText('Effective from is required')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('offers no employees while the people list has not loaded', () => {
    gql.users.mockReturnValue({ data: undefined });
    renderForm(ROW);

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
  });

  it('keeps the form open and repeats the reason when the save fails', async () => {
    gql.save.mockRejectedValue(new Error('Effective date is in a closed payroll period'));
    renderForm(ROW);
    await press('Update');

    expect(
      await screen.findByText('Effective date is in a closed payroll period'),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('says the save failed when the error carries no message', async () => {
    gql.save.mockRejectedValue('network down');
    renderForm(ROW);
    await press('Update');

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.save).not.toHaveBeenCalled();
  });
});
