import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TdsMode } from '@exyconn/shell/graphql/generated';
import { PayrollSettingsPage } from '../../../../src/pages/payroll-settings';
import { renderWithProviders } from '../../test-utils';
import { payrollSettings } from './payroll-settings-fixture';

const gql = vi.hoisted(() => ({ settings: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePayrollSettingsQuery: (options: unknown) => gql.settings(options),
}));

vi.mock('../../../../src/pages/payroll-settings/forms/payroll-settings', async () => ({
  PayrollSettingsForm: (await import('../../harness/form-stub')).FormStub,
}));

function answer(result: { data?: unknown; loading?: boolean; error?: Error }) {
  gql.settings.mockReturnValue({ loading: false, refetch: gql.refetch, ...result });
}

/** The value written beside one summary label. */
function summaryOf(label: string): string | null {
  return screen.getByText(label).nextElementSibling?.textContent ?? null;
}

describe('PayrollSettingsPage', () => {
  beforeEach(() => {
    gql.refetch.mockReset().mockResolvedValue({});
    gql.settings.mockReset();
    answer({ data: { payrollSettings: payrollSettings() } });
  });

  it('reads the policy fresh from the network as well as the cache', () => {
    renderWithProviders(<PayrollSettingsPage />);

    expect(gql.settings).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Payroll Settings' })).toBeInTheDocument();
  });

  it('shows a spinner until the policy first arrives', () => {
    answer({ loading: true });
    renderWithProviders(<PayrollSettingsPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('What the next run will withhold')).not.toBeInTheDocument();
  });

  it('says why the policy could not be read', () => {
    answer({ error: new Error('Not allowed to read payroll') });
    renderWithProviders(<PayrollSettingsPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed to read payroll');
  });

  it('keeps the loaded policy on screen while it refreshes', () => {
    answer({ data: { payrollSettings: payrollSettings() }, loading: true });
    renderWithProviders(<PayrollSettingsPage />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('What the next run will withhold')).toBeInTheDocument();
  });

  it('opens the form on the stored policy and sums up what each head withholds', () => {
    renderWithProviders(<PayrollSettingsPage />);

    expect(screen.getByText(/^Form for /)).toHaveTextContent('"runFromDay":25');
    expect(summaryOf('Provident fund')).toBe('12% of basic, capped at 15000');
    expect(summaryOf('Employee state insurance')).toBe('0.75% of gross, up to 21000');
    expect(summaryOf('Professional tax')).toBe('200 a month');
    expect(summaryOf('Income tax')).toBe(
      'The bands in HR › Tax Slabs, unless the employee has their own rate',
    );
  });

  it('says a head is not withheld when it is switched off', () => {
    answer({
      data: {
        payrollSettings: payrollSettings({
          pfEnabled: false,
          esiEnabled: false,
          professionalTaxMonthly: 0,
          tdsMode: TdsMode.None,
        }),
      },
    });
    renderWithProviders(<PayrollSettingsPage />);

    expect(screen.getAllByText('Not withheld')).toHaveLength(4);
  });

  it('describes a flat income-tax rate', () => {
    answer({ data: { payrollSettings: payrollSettings({ tdsMode: TdsMode.FlatPercent }) } });
    renderWithProviders(<PayrollSettingsPage />);

    expect(summaryOf('Income tax')).toBe('A flat percentage of taxable pay');
  });

  it('treats a TDS mode it does not know as not withheld', () => {
    answer({ data: { payrollSettings: payrollSettings({ tdsMode: 'LEGACY' as TdsMode }) } });
    renderWithProviders(<PayrollSettingsPage />);

    expect(summaryOf('Income tax')).toBe('Not withheld');
  });

  it('re-reads the policy after a save and after a cancel', async () => {
    renderWithProviders(<PayrollSettingsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(2);
  });

  it('stays put when the re-read fails', async () => {
    gql.refetch.mockRejectedValue(new Error('offline'));
    renderWithProviders(<PayrollSettingsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText('What the next run will withhold')).toBeInTheDocument();
  });
});
