import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaxSlabForm, type TaxSlabRow } from '../../../../../../src/pages/tax-slabs/forms/tax-slab';
import { renderWithProviders } from '../../../../test-utils';
import { chooseOption, press, setNumber, typeInto } from '../../../../harness/forms';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateTaxSlabMutation: () => [gql.create],
  useUpdateTaxSlabMutation: () => [gql.update],
}));

const OPTIONS = [
  { value: 'OLD', label: 'Old regime (2025-26)' },
  { value: 'NEW', label: 'New regime (2026-27)' },
];

const BAND: TaxSlabRow = {
  id: 'slab-2',
  regimeKey: 'NEW',
  financialYear: '2026-27',
  fromAmount: 400000,
  toAmount: 800000,
  ratePercent: 5,
  order: 1,
  active: true,
};

const onDone = vi.fn();
const onCancel = vi.fn();

function renderForm(
  initial: TaxSlabRow | null = null,
  regimeKey = 'NEW',
  financialYear = '2026-27',
) {
  return renderWithProviders(
    <TaxSlabForm
      initial={initial}
      regimeOptions={OPTIONS}
      defaultRegimeKey={regimeKey}
      defaultFinancialYear={financialYear}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
}

describe('TaxSlabForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('files a new top band under the page regime, applied, with no upper bound', async () => {
    renderForm();
    expect(
      screen.getByText(/Each band’s rate applies only to the part of the year’s income inside it/),
    ).toBeInTheDocument();
    setNumber('Position', '3');
    setNumber('From', '2400000');
    setNumber('Rate (%)', '30');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          regimeKey: 'NEW',
          financialYear: '2026-27',
          fromAmount: 2400000,
          toAmount: null,
          ratePercent: 30,
          order: 3,
          active: true,
        },
      },
    });
    expect(await screen.findByText('Tax slab created')).toBeInTheDocument();
  });

  it('moves a band to another regime, retires it and keeps its ceiling', async () => {
    renderForm(BAND);
    expect(screen.getByRole('spinbutton', { name: 'To' })).toHaveValue(800000);
    await chooseOption('Regime', 'Old regime (2025-26)');
    await typeInto('Financial year', '2025-26');
    setNumber('Rate (%)', '10');
    await userEvent.click(screen.getByLabelText('Apply this band'));
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'slab-2',
        input: {
          regimeKey: 'OLD',
          financialYear: '2025-26',
          fromAmount: 400000,
          toAmount: 800000,
          ratePercent: 10,
          order: 1,
          active: false,
        },
      },
    });
    expect(await screen.findByText('Tax slab updated')).toBeInTheDocument();
  });

  it('opens the top band of a table with its upper bound left empty', () => {
    renderForm({ ...BAND, toAmount: null });

    expect(screen.getByRole('spinbutton', { name: 'To' })).toHaveValue(null);
  });

  it('will not save a band whose upper bound is not above its lower one', async () => {
    renderForm(BAND);
    setNumber('To', '400000');
    await press('Update');

    expect(
      await screen.findByText('The upper bound has to be above the lower one'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('asks for a regime and a year written as 2026-27', async () => {
    renderForm(null, '', '');
    await press('Create');

    expect(await screen.findByText('Choose the regime this band belongs to')).toBeInTheDocument();
    expect(screen.getByText('Write the financial year as 2026-27')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative lower bound, a rate over 100% and a fractional position', async () => {
    renderForm();
    setNumber('From', '-1');
    setNumber('Rate (%)', '150');
    setNumber('Position', '1.5');
    await press('Create');

    expect(await screen.findByText('The lower bound cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('A rate cannot exceed 100%')).toBeInTheDocument();
    expect(screen.getByText('Use a whole number')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative rate and a negative position', async () => {
    renderForm();
    setNumber('Rate (%)', '-2');
    setNumber('Position', '-1');
    await press('Create');

    expect(await screen.findByText('A rate cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('The order cannot be negative')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Bands overlap'));
    renderForm(BAND);
    await press('Update');

    expect(await screen.findByText('Bands overlap')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
