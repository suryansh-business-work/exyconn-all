import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceRuleOperator } from '@exyconn/shell/graphql/generated';
import { AudienceConditionValue } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceConditionValue';
import type { AudienceConditionValues } from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';
import { renderWithProviders } from '../../../../test-utils';
import { answered, pending } from '../../../../fixtures';
import { chooseOption, optionsOf, press } from '../../../../form-helpers';
import { FILTER_FIELDS } from '../../audience.fixtures';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

const gql = vi.hoisted(() => ({ values: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAudienceFilterValuesQuery: (options: unknown) => gql.values(options),
}));

const [CITY, STATUS, EMAIL_STATUS, LAST_CONTACTED] = FILTER_FIELDS;

function renderValue(
  field = CITY,
  operator = AudienceRuleOperator.Equals,
  messages: Record<string, string> = {},
) {
  const probe = formProbe();
  const condition: AudienceConditionValues = { key: 'k1', field: field.key, operator, value: '' };
  const view = renderWithProviders(
    <AudienceFormHarness values={{ conditions: [condition] }} capture={probe.capture}>
      <AudienceConditionValue index={0} field={field} operator={operator} />
    </AudienceFormHarness>,
    { messages },
  );
  return { probe, view };
}

const value = (probe: ReturnType<typeof formProbe>) => probe.values().conditions[0].value;

describe('AudienceConditionValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.values.mockReturnValue(answered({ audienceFilterValues: ['Delhi', 'Mumbai'] }));
  });

  it('asks for nothing when the comparison needs no value', () => {
    for (const operator of [
      AudienceRuleOperator.IsEmpty,
      AudienceRuleOperator.IsNotEmpty,
      AudienceRuleOperator.Never,
    ]) {
      const { view } = renderValue(LAST_CONTACTED, operator);
      expect(screen.queryByLabelText(/Value|Days/)).toBeNull();
      view.unmount();
    }
    expect(gql.values).not.toHaveBeenCalled();
  });

  it('asks for a whole number of days for a day comparison', async () => {
    const { probe } = renderValue(LAST_CONTACTED, AudienceRuleOperator.WithinDays);

    const days = screen.getByRole('spinbutton', { name: 'Days' });
    expect(days).toHaveAttribute('min', '1');
    expect(days).toHaveAttribute('step', '1');
    fireEvent.change(days, { target: { value: '0' } });
    await press('Check');
    expect(await screen.findByText('Enter a number of days from 1 to 3650')).toBeInTheDocument();

    fireEvent.change(days, { target: { value: '30' } });
    expect(value(probe)).toBe('30');
  });

  it('offers the fixed values of an enum field, worded for people', async () => {
    const { probe } = renderValue(STATUS);

    expect(await optionsOf('Value')).toEqual(['Active', 'Left Company']);
    await chooseOption('Value', 'Left Company');
    expect(value(probe)).toBe('LEFT_COMPANY');
    expect(gql.values).not.toHaveBeenCalled();
  });

  it('offers the email statuses as a fixed list', async () => {
    renderValue(EMAIL_STATUS);

    expect(await optionsOf('Value')).toEqual(['Valid', 'Risky']);
  });

  it('suggests the values already in the CRM for a text field, and takes free text', async () => {
    const { probe } = renderValue(CITY);

    expect(gql.values).toHaveBeenCalledWith({ variables: { field: 'contact.city' } });
    const input = screen.getByRole('combobox', { name: 'Value' });
    await userEvent.click(input);
    const listbox = await screen.findByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Delhi', 'Mumbai']);
    await userEvent.click(within(listbox).getByRole('option', { name: 'Mumbai' }));
    expect(value(probe)).toBe('Mumbai');

    await userEvent.clear(input);
    await userEvent.type(input, 'Pune');
    expect(value(probe)).toBe('Pune');
  });

  it('asks for a value, in the viewer’s language', async () => {
    renderValue(CITY, AudienceRuleOperator.Equals, { 'Enter a value': 'Wert eingeben' });

    await press('Check');

    expect(await screen.findByText('Wert eingeben')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Value' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows that suggestions are loading', async () => {
    gql.values.mockReturnValue(pending());
    renderValue(CITY);

    await userEvent.click(screen.getByRole('combobox', { name: 'Value' }));

    expect(await screen.findByText('Loading…')).toBeInTheDocument();
  });
});
