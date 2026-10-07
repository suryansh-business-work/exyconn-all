import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientTaxIdType, GstStatesDocument } from '@exyconn/shell/graphql/generated';
import { countryName } from '@exyconn/i18n';
import { renderWithProviders } from '../../test-utils';
import { FormHarness, formValues } from '../../form-harness';
import { ClientLocationFields } from '../../../../src/pages/clients/forms/client/client-location.fields';
import { ClientTaxFields } from '../../../../src/pages/clients/forms/client/client-tax.fields';
import type { ClientFormValues } from '../../../../src/pages/clients/forms/client/client.types';
import { clientValues } from './client.fixtures';

const gstStates = {
  request: { query: GstStatesDocument },
  result: { data: { gstStates: [{ __typename: 'GstState', code: '27', name: 'Maharashtra' }] } },
};

const renderFields = (overrides: Partial<ClientFormValues>) =>
  renderWithProviders(
    <FormHarness<ClientFormValues> defaultValues={clientValues(overrides)}>
      <ClientLocationFields />
      <ClientTaxFields />
    </FormHarness>,
    { mocks: [gstStates] },
  );

async function typeOptions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: /Tax number type/ }));
  const names = within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent);
  await user.keyboard('{Escape}');
  // The menu hides the rest of the form from assistive tech until it has fully closed.
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  return names;
}

async function chooseCountry(user: ReturnType<typeof userEvent.setup>, code: string) {
  const name = countryName(code);
  const field = screen.getByRole('combobox', { name: 'Country' });
  await user.clear(field);
  await user.type(field, name);
  await user.click(await screen.findByRole('option', { name }));
}

const india = countryName('IN');
const germany = countryName('DE');

describe('ClientTaxFields', () => {
  it('asks for the kind first when there is no country and no kind chosen', async () => {
    const user = userEvent.setup();
    renderFields({});
    expect(screen.getByText('Choose the type first, then type the number')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /GST state/ })).toBeNull();
    expect(await typeOptions(user)).toEqual(['Tax ID (any country)']);
  });

  it('offers an Indian client a GSTIN, the GST state and an example number', async () => {
    const user = userEvent.setup();
    renderFields({ country: 'IN', taxIdType: ClientTaxIdType.InGst, stateCode: '27' });
    expect(screen.getByText('For example 27AAPFU0939F1ZV')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /GST state/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Invoicing currency' })).toBeInTheDocument();
    expect(await typeOptions(user)).toEqual([`GSTIN (${india})`, 'Tax ID (any country)']);
  });

  it('moves a new country to its own kind of number and drops the GST state', async () => {
    const user = userEvent.setup();
    renderFields({ country: 'IN', taxIdType: ClientTaxIdType.InGst, stateCode: '27' });
    await chooseCountry(user, 'DE');

    expect(formValues()).toMatchObject({
      country: 'DE',
      taxIdType: ClientTaxIdType.EuVat,
      stateCode: '',
    });
    expect(screen.queryByRole('combobox', { name: /GST state/ })).toBeNull();
    expect(screen.getByText('For example DE123456789')).toBeInTheDocument();
  });

  it('keeps the kind of a number already typed, and still offers it', async () => {
    const user = userEvent.setup();
    renderFields({
      country: 'IN',
      taxIdType: ClientTaxIdType.InGst,
      taxId: '27AAPFU0939F1ZV',
      stateCode: '27',
    });
    await chooseCountry(user, 'DE');

    expect(formValues()).toMatchObject({ taxIdType: ClientTaxIdType.InGst, stateCode: '' });
    expect(await typeOptions(user)).toEqual([
      `GSTIN (${india})`,
      `VAT number (${germany})`,
      'Tax ID (any country)',
    ]);
  });

  it('keeps the GST state field for a client moved to India', async () => {
    const user = userEvent.setup();
    renderFields({ country: 'DE', taxIdType: ClientTaxIdType.EuVat });
    await chooseCountry(user, 'IN');

    expect(formValues()).toMatchObject({ country: 'IN', taxIdType: ClientTaxIdType.InGst });
    expect(screen.getByRole('combobox', { name: /GST state/ })).toBeInTheDocument();
  });
});
