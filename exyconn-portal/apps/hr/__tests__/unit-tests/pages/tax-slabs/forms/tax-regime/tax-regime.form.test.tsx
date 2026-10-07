import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TaxRegimeForm,
  type TaxRegimeRow,
} from '../../../../../../src/pages/tax-slabs/forms/tax-regime';
import { renderWithProviders } from '../../../../test-utils';
import { press, setNumber, typeInto } from '../../../../harness/forms';
import { REGIMES } from '../../tax-slabs.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateTaxRegimeMutation: () => [gql.create],
  useUpdateTaxRegimeMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: TaxRegimeRow | null = null) =>
  renderWithProviders(<TaxRegimeForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('TaxRegimeForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('adds a regime with its deduction, rebate and cess, applied by default', async () => {
    renderForm();
    expect(
      screen.getByText(/Check every figure against this year’s finance act/),
    ).toBeInTheDocument();
    await typeInto('Key', ' NEW_2026 ');
    await typeInto('Financial year', '2026-27');
    await typeInto('Name', 'New regime');
    setNumber('Standard deduction', '75000');
    setNumber('Rebate threshold', '1200000');
    setNumber('Maximum rebate', '60000');
    setNumber('Cess (%)', '4');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          regimeKey: 'NEW_2026',
          financialYear: '2026-27',
          name: 'New regime',
          standardDeduction: 75000,
          rebateIncomeLimit: 1200000,
          rebateMaxTax: 60000,
          cessPercent: 4,
          active: true,
        },
      },
    });
    expect(await screen.findByText('Tax regime created')).toBeInTheDocument();
  });

  it('opens a regime with its figures and saves it, switched off, by id', async () => {
    const [old] = REGIMES;
    renderForm({ ...old, active: true });
    expect(screen.getByRole('textbox', { name: 'Key' })).toHaveValue('OLD');
    expect(screen.getByRole('spinbutton', { name: 'Standard deduction' })).toHaveValue(50000);
    await userEvent.click(screen.getByLabelText('Apply this regime'));
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'regime-old',
        input: {
          regimeKey: 'OLD',
          financialYear: '2025-26',
          name: 'Old regime',
          standardDeduction: 50000,
          rebateIncomeLimit: 500000,
          rebateMaxTax: 12500,
          cessPercent: 4,
          active: false,
        },
      },
    });
    expect(await screen.findByText('Tax regime updated')).toBeInTheDocument();
  });

  it('asks for a key, a year written as 2026-27 and a name', async () => {
    renderForm();
    await press('Create');

    expect(await screen.findByText('A key is required')).toBeInTheDocument();
    expect(screen.getByText('Write the financial year as 2026-27')).toBeInTheDocument();
    expect(screen.getByText('A name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants the key in capitals, digits and underscores', async () => {
    renderForm(REGIMES[1]);
    await typeInto('Key', 'new-regime');
    await press('Update');

    expect(
      await screen.findByText('Use capitals, digits and underscores, e.g. NEW or OLD'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('refuses negative figures and a cess over 100%', async () => {
    renderForm(REGIMES[1]);
    setNumber('Standard deduction', '-1');
    setNumber('Rebate threshold', '-1');
    setNumber('Maximum rebate', '-1');
    setNumber('Cess (%)', '101');
    await press('Update');

    expect(
      await screen.findByText('The standard deduction cannot be negative'),
    ).toBeInTheDocument();
    expect(screen.getByText('The rebate threshold cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('The rebate cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('Cess cannot exceed 100%')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('refuses a negative cess', async () => {
    renderForm(REGIMES[1]);
    setNumber('Cess (%)', '-4');
    await press('Update');

    expect(await screen.findByText('Cess cannot be negative')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('A regime with this key exists for that year'));
    renderForm(REGIMES[1]);
    await press('Update');

    expect(
      await screen.findByText('A regime with this key exists for that year'),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
