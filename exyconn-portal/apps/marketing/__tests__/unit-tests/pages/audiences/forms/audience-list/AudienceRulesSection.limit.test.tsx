import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceRuleOperator } from '@exyconn/shell/graphql/generated';
import { AudienceRulesSection } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceRulesSection';
import { MAX_CONDITIONS } from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';
import { renderWithProviders } from '../../../../test-utils';
import { FILTER_FIELDS } from '../../audience.fixtures';
import { AudienceFormHarness, formProbe } from './audience-form-harness';

// Twenty-five real rows are slow to render; the limit only needs to know how many there are.
vi.mock('../../../../../../src/pages/audiences/forms/audience-list/AudienceConditionRow', () => ({
  AudienceConditionRow: ({ index }: Readonly<{ index: number }>) => (
    <p>{`Condition row ${index + 1}`}</p>
  ),
}));

const conditions = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    key: `k${index}`,
    field: 'contact.city',
    operator: AudienceRuleOperator.Equals,
    value: 'Delhi',
  }));

function renderRules(count: number) {
  const probe = formProbe();
  renderWithProviders(
    <AudienceFormHarness values={{ conditions: conditions(count) }} capture={probe.capture}>
      <AudienceRulesSection fields={FILTER_FIELDS} loading={false} />
    </AudienceFormHarness>,
  );
  return probe;
}

const addButton = () => screen.getByRole('button', { name: 'Add condition' });

describe('AudienceRulesSection — the condition limit', () => {
  it('adds the last condition the server takes, then stops', async () => {
    const probe = renderRules(MAX_CONDITIONS - 1);
    expect(addButton()).toBeEnabled();

    await userEvent.click(addButton());

    expect(probe.values().conditions).toHaveLength(25);
    expect(screen.getByText('Condition row 25')).toBeInTheDocument();
    expect(addButton()).toBeDisabled();
  });

  it('joins every condition after the first to the one before it', () => {
    renderRules(3);

    expect(screen.getAllByRole('separator').map((divider) => divider.textContent)).toEqual([
      'AND',
      'AND',
    ]);
  });
});
