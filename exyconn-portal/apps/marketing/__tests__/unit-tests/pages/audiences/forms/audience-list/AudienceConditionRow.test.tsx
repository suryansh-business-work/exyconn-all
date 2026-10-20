import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceRuleOperator } from '@exyconn/shell/graphql/generated';
import { AudienceConditionRow } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceConditionRow';
import type { AudienceConditionValues } from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';
import { renderWithProviders } from '../../../../test-utils';
import { answered } from '../../../../fixtures';
import { chooseOption, optionsOf, press } from '../../../../form-helpers';
import { FILTER_FIELDS } from '../../audience.fixtures';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAudienceFilterValuesQuery: () => answered({ audienceFilterValues: [] }),
}));

function renderRow(condition: Partial<AudienceConditionValues> = {}, fields = FILTER_FIELDS) {
  const probe = formProbe();
  const onRemove = vi.fn();
  renderWithProviders(
    <AudienceFormHarness
      values={{
        conditions: [
          {
            key: 'k1',
            field: 'contact.city',
            operator: AudienceRuleOperator.Contains,
            value: 'Del',
            ...condition,
          },
        ],
      }}
      capture={probe.capture}
    >
      <AudienceConditionRow index={0} fields={fields} onRemove={onRemove} />
    </AudienceFormHarness>,
  );
  return { probe, onRemove, row: () => probe.values().conditions[0] };
}

describe('AudienceConditionRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a group named by its position, offering every field in the catalogue', async () => {
    renderRow();

    expect(screen.getByRole('group', { name: 'Condition 1' })).toBeInTheDocument();
    expect(await optionsOf('Field')).toEqual([
      'Contact city',
      'Contact status',
      'Email status',
      'Last contacted',
    ]);
  });

  it('offers only the comparisons the chosen field allows', async () => {
    renderRow();

    expect(await optionsOf('Comparison')).toEqual([
      'is',
      'is not',
      'contains',
      'is empty',
      'is not empty',
    ]);
    expect(screen.getByRole('combobox', { name: 'Value' })).toHaveValue('Del');
  });

  it('starts a new field from its first comparison when the old one does not apply', async () => {
    const { row } = renderRow();

    await chooseOption('Field', 'Last contacted');

    expect(row()).toMatchObject({
      field: 'activity.lastContacted',
      operator: AudienceRuleOperator.WithinDays,
      value: '',
    });
    expect(screen.getByRole('spinbutton', { name: 'Days' })).toHaveValue(null);
  });

  it('keeps a comparison the new field also allows, but clears the old value', async () => {
    const { row } = renderRow({ operator: AudienceRuleOperator.NotEquals });

    await chooseOption('Field', 'Contact status');

    expect(row()).toMatchObject({
      field: 'contact.status',
      operator: AudienceRuleOperator.NotEquals,
      value: '',
    });
    expect(await optionsOf('Value')).toEqual(['Active', 'Left Company']);
  });

  it('drops the value input for a comparison that needs none', async () => {
    renderRow();

    await chooseOption('Comparison', 'is empty');

    expect(screen.queryByRole('combobox', { name: 'Value' })).toBeNull();
  });

  it('asks for a field before anything else, with no comparison or value to offer', async () => {
    renderRow({ field: '', operator: AudienceRuleOperator.Equals, value: '' });

    expect(screen.queryByRole('combobox', { name: 'Value' })).toBeNull();
    expect(await optionsOf('Comparison')).toEqual([]);

    await press('Check');

    expect(await screen.findByText('Choose a field')).toBeInTheDocument();
  });

  it('shows no value input for a field the catalogue no longer offers', () => {
    renderRow({ field: 'contact.removed' }, FILTER_FIELDS.slice(1));

    expect(screen.queryByRole('combobox', { name: 'Value' })).toBeNull();
  });

  it('removes itself', async () => {
    const { onRemove } = renderRow();

    await userEvent.click(screen.getByRole('button', { name: 'Remove condition 1' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
