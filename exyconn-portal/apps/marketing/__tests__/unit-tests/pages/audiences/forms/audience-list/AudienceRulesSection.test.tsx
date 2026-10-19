import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceRuleCombinator, AudienceRuleOperator } from '@exyconn/shell/graphql/generated';
import { AudienceRulesSection } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceRulesSection';
import {
  MAX_CONDITIONS,
  type AudienceFormValues,
} from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';
import { renderWithProviders } from '../../../../test-utils';
import { answered } from '../../../../fixtures';
import { chooseOption, press } from '../../../../form-helpers';
import { FILTER_FIELDS } from '../../audience.fixtures';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAudienceFilterValuesQuery: () => answered({ audienceFilterValues: [] }),
}));

const NO_CONDITIONS = 'No conditions: every record in the chosen source matches.';

const condition = (index: number) => ({
  key: `k${index}`,
  field: 'contact.city',
  operator: AudienceRuleOperator.Equals,
  value: `City ${index}`,
});

function renderRules(values: Partial<AudienceFormValues> = {}, loading = false) {
  const probe = formProbe();
  const onValid = vi.fn();
  renderWithProviders(
    <AudienceFormHarness
      values={{ name: 'Cafés', ...values }}
      capture={probe.capture}
      onValid={onValid}
    >
      <AudienceRulesSection fields={FILTER_FIELDS} loading={loading} />
    </AudienceFormHarness>,
  );
  return { probe, onValid };
}

const addButton = () => screen.getByRole('button', { name: 'Add condition' });

describe('AudienceRulesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('says every record matches while there are no conditions', () => {
    renderRules();

    expect(screen.getByText(NO_CONDITIONS)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Condition/ })).toBeNull();
    expect(addButton()).toBeEnabled();
  });

  it('adds a blank condition that must be completed before saving', async () => {
    const { probe, onValid } = renderRules();

    await userEvent.click(addButton());

    expect(screen.queryByText(NO_CONDITIONS)).toBeNull();
    expect(screen.getByRole('group', { name: 'Condition 1' })).toBeInTheDocument();
    expect(probe.values().conditions).toEqual([
      expect.objectContaining({ field: '', operator: AudienceRuleOperator.Equals, value: '' }),
    ]);
    await press('Check');
    expect(await screen.findByText('Choose a field')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();

    await chooseOption('Field', 'Contact status');
    await chooseOption('Value', 'Active');
    await press('Check');
    expect(onValid).toHaveBeenCalledTimes(1);
  });

  it('joins the conditions with the chosen combinator', async () => {
    const { probe } = renderRules({ conditions: [condition(1), condition(2)] });

    expect(screen.getByRole('separator')).toHaveTextContent('AND');
    expect(screen.getByRole('button', { name: 'All (AND)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Any (OR)' }));

    expect(probe.values().ruleCombinator).toBe(AudienceRuleCombinator.Or);
    expect(screen.getByRole('separator')).toHaveTextContent('OR');
  });

  it('keeps the combinator when the chosen one is pressed again', async () => {
    const { probe } = renderRules();

    await userEvent.click(screen.getByRole('button', { name: 'All (AND)' }));

    expect(probe.values().ruleCombinator).toBe(AudienceRuleCombinator.And);
    expect(screen.getByRole('group', { name: 'Match' })).toBeInTheDocument();
  });

  it('removes the condition whose bin was pressed', async () => {
    const { probe } = renderRules({ conditions: [condition(1), condition(2)] });

    await userEvent.click(screen.getByRole('button', { name: 'Remove condition 1' }));

    expect(probe.values().conditions.map((entry) => entry.value)).toEqual(['City 2']);
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('waits for the field catalogue before a condition can be added', () => {
    renderRules({}, true);

    expect(addButton()).toBeDisabled();
  });

  it('stops adding at the most conditions the server takes', () => {
    renderRules({
      conditions: Array.from({ length: MAX_CONDITIONS }, (_, index) => condition(index)),
    });

    expect(screen.getAllByRole('group', { name: /^Condition \d+$/ })).toHaveLength(25);
    expect(addButton()).toBeDisabled();
  });
});
