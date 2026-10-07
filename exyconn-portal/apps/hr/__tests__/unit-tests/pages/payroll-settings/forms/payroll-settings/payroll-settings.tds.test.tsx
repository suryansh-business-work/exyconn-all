import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TdsMode } from '@exyconn/shell/graphql/generated';
import {
  PayrollSettingsForm,
  type PayrollSettingsRow,
} from '../../../../../../src/pages/payroll-settings/forms/payroll-settings';
import { renderWithProviders } from '../../../../test-utils';
import { REGIMES, payrollSettings } from '../../payroll-settings-fixture';

const gql = vi.hoisted(() => ({
  save: vi.fn(),
  regimes: { data: undefined as unknown, loading: false },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdatePayrollSettingsMutation: () => [gql.save],
  useTaxRegimeChoicesQuery: () => gql.regimes,
}));

const NO_REGIMES =
  'No regimes on file yet — add one in HR › Tax Slabs, or nothing will be withheld.';

function renderForm(initial: PayrollSettingsRow = payrollSettings()) {
  renderWithProviders(
    <PayrollSettingsForm initial={initial} onDone={vi.fn()} onCancel={vi.fn()} />,
  );
}

async function chooseMode(label: string) {
  await userEvent.click(screen.getByRole('combobox', { name: /Income tax \(TDS\)/ }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }));
}

const savedInput = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Save deductions' }));
  await waitFor(() => expect(gql.save).toHaveBeenCalledTimes(1));
  return gql.save.mock.calls[0][0].variables.input;
};

describe('PayrollSettingsForm income tax', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    gql.regimes = { data: REGIMES, loading: false };
  });

  it('asks for nothing more while income tax is not withheld', () => {
    renderForm(payrollSettings({ tdsMode: TdsMode.None }));

    expect(screen.queryByLabelText('Company TDS rate (%)')).not.toBeInTheDocument();
    expect(screen.queryByText('Tax bands')).not.toBeInTheDocument();
  });

  it('asks only for the company rate in flat mode', async () => {
    renderForm(payrollSettings({ tdsMode: TdsMode.None }));

    await chooseMode('A flat percentage of taxable pay');

    expect(screen.getByLabelText('Company TDS rate (%)')).toHaveValue(10);
    expect(screen.queryByText('Tax bands')).not.toBeInTheDocument();
    expect((await savedInput()).tdsMode).toBe(TdsMode.FlatPercent);
  });

  it('shows the regime, the bands, the exemption and the cess in band mode', async () => {
    renderForm(payrollSettings({ tdsMode: TdsMode.FlatPercent }));

    await chooseMode('Tax bands (with a per-employee rate taking precedence)');

    expect(screen.queryByLabelText('Company TDS rate (%)')).not.toBeInTheDocument();
    expect(screen.getByText('Tax bands')).toBeInTheDocument();
    expect(screen.getByLabelText('Annual exemption')).toHaveValue(50000);
    expect(screen.getByLabelText('Cess (%)')).toHaveValue(4);
    expect(screen.getByLabelText('Financial year starts in month')).toHaveValue(4);
    expect(screen.getByRole('combobox', { name: /^Regime/ })).toHaveTextContent('New regime');
  });

  it('offers every regime on file and saves the one chosen', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('combobox', { name: /^Regime/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Old regime' }),
    );

    expect((await savedInput()).tdsRegimeKey).toBe('OLD');
    expect(screen.queryByText(NO_REGIMES)).not.toBeInTheDocument();
  });

  it('warns that nothing will be withheld while no regime is on file', () => {
    gql.regimes = { data: undefined, loading: false };
    renderForm();

    expect(screen.getByText(NO_REGIMES)).toBeInTheDocument();
  });

  it('does not warn while the regimes are still loading', () => {
    gql.regimes = { data: undefined, loading: true };
    renderForm();

    expect(screen.queryByText(NO_REGIMES)).not.toBeInTheDocument();
  });

  it('lists each band, marking the last one as open-ended', () => {
    renderForm();

    const upTo = screen.getAllByLabelText('Up to (annual)');
    expect(upTo).toHaveLength(2);
    expect(upTo[0]).toHaveValue(300000);
    expect(upTo[1]).toHaveValue(null);
    expect(screen.getAllByText('Empty = everything above')).toHaveLength(1);
    expect(
      screen.getAllByLabelText('Rate (%)').map((input) => (input as HTMLInputElement).value),
    ).toEqual(['0', '5']);
  });

  it('adds an open-ended band at 0% and saves it', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Add band' }));

    expect(screen.getAllByLabelText('Up to (annual)')).toHaveLength(3);
    expect((await savedInput()).tdsSlabs).toEqual([
      { upTo: 300000, percent: 0 },
      { upTo: null, percent: 5 },
      { upTo: null, percent: 0 },
    ]);
  });

  it('removes the band whose bin was pressed', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Remove band 1' }));

    expect(screen.queryByRole('button', { name: 'Remove band 2' })).not.toBeInTheDocument();
    expect((await savedInput()).tdsSlabs).toEqual([{ upTo: null, percent: 5 }]);
  });

  it('refuses a negative band limit or a band rate over 100%', async () => {
    renderForm();

    await userEvent.clear(screen.getAllByLabelText('Up to (annual)')[0]);
    await userEvent.paste('-1');
    await userEvent.clear(screen.getAllByLabelText('Rate (%)')[1]);
    await userEvent.paste('120');
    await userEvent.click(screen.getByRole('button', { name: 'Save deductions' }));

    expect(await screen.findByText('Cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('A band rate cannot exceed 100%')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });
});
