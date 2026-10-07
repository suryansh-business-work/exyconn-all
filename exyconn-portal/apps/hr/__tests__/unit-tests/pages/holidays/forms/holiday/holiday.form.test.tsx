import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HolidayType } from '@exyconn/shell/graphql/generated';
import { HolidayForm, type HolidayRow } from '../../../../../../src/pages/holidays/forms/holiday';
import { renderWithProviders } from '../../../../test-utils';
import {
  listClosed,
  localIso,
  pickDate,
  pickOption,
  press,
  typeInto,
} from '../../../../harness/forms';

vi.setConfig({ testTimeout: 30_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateHolidayMutation: () => [gql.create],
  useUpdateHolidayMutation: () => [gql.update],
}));

/** A country holiday narrowed to a region and a city, still carrying a stale opt-out. */
const diwali: HolidayRow = {
  id: 'holiday-4',
  name: 'Diwali',
  date: localIso(2026, 10, 8),
  type: HolidayType.Public,
  description: 'Festival of lights',
  country: 'IN',
  excludedCountries: ['US'],
  regions: ['Maharashtra'],
  cities: ['Pune'],
};

function renderForm(initial: HolidayRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<HolidayForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

const updatedInput = () => gql.update.mock.calls[0][0].variables.input;

describe('HolidayForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
  });

  it('asks for a name and a date', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a company-wide holiday with the countries that opt out', async () => {
    const { onDone } = renderForm();

    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('All countries');
    expect(screen.queryByRole('combobox', { name: 'Cities' })).not.toBeInTheDocument();
    await typeInto('Name', 'New Year');
    pickDate('date', '01/01/2027');
    await userEvent.click(screen.getByRole('combobox', { name: /^Not observed in/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'United States' }),
    );
    await userEvent.keyboard('{Escape}');
    await listClosed();
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'New Year',
            date: localIso(2027, 0, 1),
            type: HolidayType.Optional,
            description: null,
            country: '',
            excludedCountries: ['US'],
            regions: [],
            cities: [],
          },
        },
      }),
    );
    expect(await screen.findByText('Holiday created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('narrows a new country holiday to the regions typed in', async () => {
    renderForm();

    await typeInto('Name', 'Goa Liberation Day');
    pickDate('date', '12/19/2026');
    const country = screen.getByRole('combobox', { name: 'Country' });
    await userEvent.clear(country);
    await userEvent.type(country, 'Indi');
    await userEvent.click(await screen.findByRole('option', { name: 'India' }));
    expect(screen.queryByRole('combobox', { name: /^Not observed in/ })).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('combobox', { name: 'States / regions' }), 'Goa{Enter}');
    await press('Create');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({
      country: 'IN',
      excludedCountries: [],
      regions: ['Goa'],
      cities: [],
    });
  });

  it('drops a stale opt-out list when saving a country holiday', async () => {
    renderForm(diwali);

    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('India');
    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.id).toBe('holiday-4');
    expect(updatedInput()).toEqual({
      name: 'Diwali',
      date: diwali.date,
      type: HolidayType.Public,
      description: 'Festival of lights',
      country: 'IN',
      excludedCountries: [],
      regions: ['Maharashtra'],
      cities: ['Pune'],
    });
    expect(await screen.findByText('Holiday updated')).toBeInTheDocument();
  });

  it('drops regions and cities when a holiday becomes company-wide again', async () => {
    renderForm(diwali);

    await pickOption('Country', 'All countries');
    expect(screen.getByRole('combobox', { name: /^Not observed in/ })).toBeInTheDocument();
    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(updatedInput()).toMatchObject({
      country: '',
      excludedCountries: ['US'],
      regions: [],
      cities: [],
    });
  });

  it('will not save a region name of more than 100 characters', async () => {
    renderForm({ ...diwali, regions: ['R'.repeat(101)] });

    await press('Update');

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'States / regions' })).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('says why the save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('A holiday already falls on that date'));
    const { onDone } = renderForm(diwali);

    await press('Update');

    expect(await screen.findByText('A holiday already falls on that date')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
