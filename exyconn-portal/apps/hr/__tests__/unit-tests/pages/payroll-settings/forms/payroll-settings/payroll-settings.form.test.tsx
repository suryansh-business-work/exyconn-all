import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PayrollSettingsForm,
  type PayrollSettingsRow,
} from '../../../../../../src/pages/payroll-settings/forms/payroll-settings';
import { renderWithProviders } from '../../../../test-utils';
import { REGIMES, payrollSettings } from '../../payroll-settings-fixture';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdatePayrollSettingsMutation: () => [gql.save],
  useTaxRegimeChoicesQuery: () => ({ data: REGIMES, loading: false }),
}));

const SAVED = 'Statutory deductions saved — they apply from the next payroll run';

function renderForm(initial: PayrollSettingsRow = payrollSettings()) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <PayrollSettingsForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

/** Replaces a number field's value in one go, so a "-" or "1." is never typed half-way. */
async function retype(label: string, value: string) {
  await userEvent.clear(screen.getByLabelText(label));
  await userEvent.paste(value);
}

const save = () => userEvent.click(screen.getByRole('button', { name: 'Save deductions' }));

describe('PayrollSettingsForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: { updatePayrollSettings: {} } });
  });

  it('saves the stored policy back exactly, bands and all', async () => {
    const { onDone } = renderForm();

    await save();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    const { tdsSlabs, ...rest } = payrollSettings();
    expect(gql.save).toHaveBeenCalledWith({ variables: { input: { ...rest, tdsSlabs } } });
    expect(await screen.findByText(SAVED)).toBeInTheDocument();
  });

  it('sends edited figures as numbers', async () => {
    renderForm();

    await retype('Payroll can be run from day', '5');
    await retype('PF rate (% of basic)', '10');
    await userEvent.click(
      screen.getByRole('switch', { name: 'Withhold employee state insurance (ESI)' }),
    );
    await save();

    await waitFor(() => expect(gql.save).toHaveBeenCalledTimes(1));
    expect(gql.save.mock.calls[0][0].variables.input).toMatchObject({
      runFromDay: 5,
      pfEmployeePercent: 10,
      esiEnabled: false,
    });
  });

  it('fills in an older policy that predates the slab fields', async () => {
    const older = {
      ...payrollSettings({ tdsSlabs: [{ percent: 30 }] }),
      tdsAnnualExemption: undefined,
      tdsCessPercent: undefined,
    } as unknown as PayrollSettingsRow;
    renderForm(older);

    await save();

    await waitFor(() => expect(gql.save).toHaveBeenCalledTimes(1));
    expect(gql.save.mock.calls[0][0].variables.input).toMatchObject({
      tdsSlabs: [{ upTo: null, percent: 30 }],
      tdsAnnualExemption: 0,
      tdsCessPercent: 0,
    });
  });

  it('starts with no bands when the policy has none on file', async () => {
    renderForm({ ...payrollSettings(), tdsSlabs: undefined } as unknown as PayrollSettingsRow);

    await save();

    await waitFor(() => expect(gql.save).toHaveBeenCalledTimes(1));
    expect(gql.save.mock.calls[0][0].variables.input.tdsSlabs).toEqual([]);
  });

  it('keeps the run day to one that exists in every month', async () => {
    renderForm();

    await retype('Payroll can be run from day', '29');
    await save();

    expect(
      await screen.findByText('Choose a day from 1 to 28, so it exists in every month'),
    ).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('refuses part days, rates over 100% and negative amounts', async () => {
    renderForm();

    await retype('Payroll can be run from day', '1.5');
    await retype('PF rate (% of basic)', '101');
    await retype('ESI wage limit', '-1');
    await retype('Professional tax per month', '-5');
    await save();

    expect(await screen.findByText('Use a whole day of the month')).toBeInTheDocument();
    expect(screen.getByText('The PF rate cannot exceed 100%')).toBeInTheDocument();
    expect(screen.getByText('The ESI wage limit cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('Professional tax cannot be negative')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('asks which regime to apply when none is chosen', async () => {
    renderForm(payrollSettings({ tdsRegimeKey: '' }));

    await save();

    expect(await screen.findByText('Choose the regime to apply')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it("reports the server's reason and does not close", async () => {
    gql.save.mockRejectedValue(new Error('Payroll is locked for the month'));
    const { onDone } = renderForm();

    await save();

    expect(await screen.findByText('Payroll is locked for the month')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.save.mockRejectedValue('offline');
    renderForm();

    await save();

    expect(await screen.findByText('Could not save the policy')).toBeInTheDocument();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.save).not.toHaveBeenCalled();
  });
});
