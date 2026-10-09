import { describe, expect, it } from 'vitest';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { I18nProvider } from '@exyconn/i18n';
import { RhfAutocomplete, RhfCurrencyField, useCompanyCurrency } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

const TEAMS = [
  { value: 'eng', label: 'Engineering' },
  { value: 'ops', label: 'Operations' },
];

describe('RhfAutocomplete', () => {
  it('shows the label of the stored value and its hint', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ team: 'ops' }}>
        <RhfAutocomplete
          name="team"
          label="Team"
          options={TEAMS}
          helperText="Who they report into"
        />
      </FormHarness>,
    );

    expect(screen.getByRole('combobox', { name: 'Team' })).toHaveValue('Operations');
    expect(screen.getByRole('combobox', { name: 'Team' })).toHaveAttribute('name', 'team');
    expect(screen.getByText('Who they report into')).toBeInTheDocument();
  });

  it('stores the value of a searched-for option, and empty once cleared', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ team: '' }}>
        <RhfAutocomplete name="team" label="Team" options={TEAMS} />
      </FormHarness>,
    );

    await user.type(screen.getByRole('combobox', { name: 'Team' }), 'Eng');
    await user.click(await screen.findByRole('option', { name: 'Engineering' }));
    expect(formValues().team).toBe('eng');

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(formValues().team).toBe('');
  });

  it('shows nothing for a stored value that is not an option', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ team: 'gone' }}>
        <RhfAutocomplete name="team" label="Team" options={TEAMS} />
      </FormHarness>,
    );

    expect(screen.getByRole('combobox', { name: 'Team' })).toHaveValue('');
  });

  it('shows the validation message instead of the hint', async () => {
    const schema = z.object({ team: z.string().min(1, 'Pick a team') });
    renderWithProviders(
      <FormHarness defaultValues={{ team: '' }} resolver={zodResolver(schema)}>
        <RhfAutocomplete
          name="team"
          label="Team"
          options={TEAMS}
          helperText="Who they report into"
        />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Pick a team')).toBeInTheDocument();
    expect(screen.queryByText('Who they report into')).not.toBeInTheDocument();
  });
});

function renderCurrency(currency: string, value: string, field: ReactNode = <RhfCurrencyField />) {
  return render(
    <I18nProvider locale="en" messages={{}} settings={{ currency }}>
      <FormHarness defaultValues={{ currency: value, price: value }}>{field}</FormHarness>
    </I18nProvider>,
  );
}

describe('RhfCurrencyField', () => {
  it('fills an empty field with the company currency once the settings arrive', async () => {
    renderCurrency('EUR', '');

    await expect.poll(() => formValues().currency).toBe('EUR');
    expect(screen.getByRole('combobox', { name: 'Currency' })).toHaveValue('Euro (EUR)');
  });

  it('never overwrites a currency already chosen', async () => {
    renderCurrency('EUR', 'USD');

    expect(screen.getByRole('combobox', { name: 'Currency' })).toHaveValue('US Dollar (USD)');
    expect(formValues().currency).toBe('USD');
  });

  it('leaves the field empty while the company currency is unknown', () => {
    renderCurrency('', '');

    expect(formValues().currency).toBe('');
  });

  it('works under another field name, label and hint', async () => {
    renderCurrency(
      'GBP',
      '',
      <RhfCurrencyField name="price" label="Price currency" helperText="ISO code" />,
    );

    await expect.poll(() => formValues().price).toBe('GBP');
    expect(screen.getByRole('combobox', { name: 'Price currency' })).toBeInTheDocument();
    expect(screen.getByText('ISO code')).toBeInTheDocument();
  });
});

describe('useCompanyCurrency', () => {
  it('returns the company currency from the settings', () => {
    const { result } = renderHook(() => useCompanyCurrency(), {
      wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
        <I18nProvider locale="en" messages={{}} settings={{ currency: 'JPY' }}>
          {children}
        </I18nProvider>
      ),
    });

    expect(result.current).toBe('JPY');
  });
});
