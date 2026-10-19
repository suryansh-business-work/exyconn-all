import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { ActiveFilterChips } from '../../../../src/records/filters/ActiveFilterChips';
import { PresenceChips } from '../../../../src/records/filters/PresenceChips';
import type { FilterGroup } from '../../../../src/records/list/recordQuery';
import { renderWithProviders } from '../../test-utils';
import { choiceProperty, property } from '../records-fixtures';

const STAGE = choiceProperty({ HOT: 'Hot' });
const HAS_EMAIL = property({
  key: 'hasEmail',
  label: 'Has email',
  type: CrmPropertyType.Boolean,
  filterOnly: true,
});
const HAS_PHONE = property({
  key: 'hasPhone',
  label: 'Has phone',
  type: CrmPropertyType.Boolean,
  filterOnly: true,
});

const GROUPS: FilterGroup[] = [
  { id: 'g1', conditions: [{ id: 'c1', property: 'stage', op: CrmOp.In, values: ['HOT'] }] },
  {
    id: 'g2',
    conditions: [
      { id: 'c2', property: 'hasEmail', op: CrmOp.Eq, values: ['true'] },
      { id: 'c3', property: 'gone', op: CrmOp.IsEmpty, values: [] },
    ],
  },
];

describe('ActiveFilterChips', () => {
  it('renders nothing without filters', () => {
    renderWithProviders(<ActiveFilterChips properties={[STAGE]} groups={[]} onRemove={vi.fn()} />);
    expect(screen.queryByRole('group', { name: 'Active filters' })).not.toBeInTheDocument();
  });

  it('describes each condition, separates groups with or and removes a chip', async () => {
    const onRemove = vi.fn();
    renderWithProviders(
      <ActiveFilterChips properties={[STAGE, HAS_EMAIL]} groups={GROUPS} onRemove={onRemove} />,
    );
    const group = screen.getByRole('group', { name: 'Active filters' });
    expect(group).toHaveTextContent('Stage is any of HotorHas emailgone is unknown');
    const chip = within(group).getByText('Has email').closest('.MuiChip-root') as HTMLElement;
    await userEvent.click(within(chip).getByTestId('CancelIcon'));
    expect(onRemove).toHaveBeenCalledWith('c2');
  });

  it('writes Yes/No values with the translated words', () => {
    const vip = property({ key: 'vip', label: 'VIP', type: CrmPropertyType.Boolean });
    renderWithProviders(
      <ActiveFilterChips
        properties={[vip]}
        groups={[{ id: 'g', conditions: [{ id: 'c', property: 'vip', op: CrmOp.Eq, values: ['true'] }] }]}
        onRemove={vi.fn()}
      />,
      { messages: { Yes: 'Oui' } },
    );
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent('VIP is Oui');
  });
});

describe('PresenceChips', () => {
  it('shows one toggle per Yes/No check, on when every group requires it', async () => {
    const onApply = vi.fn();
    renderWithProviders(
      <PresenceChips properties={[STAGE, HAS_EMAIL, HAS_PHONE]} groups={[GROUPS[1]]} onApply={onApply} />,
    );
    const email = screen.getByRole('button', { name: 'Has email' });
    const phone = screen.getByRole('button', { name: 'Has phone' });
    expect(email).toHaveAttribute('aria-pressed', 'true');
    expect(phone).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Stage' })).not.toBeInTheDocument();

    await userEvent.click(email);
    expect(onApply).toHaveBeenLastCalledWith([{ id: 'g2', conditions: [GROUPS[1].conditions[1]] }]);
    await userEvent.click(phone);
    const added = onApply.mock.lastCall?.[0] as FilterGroup[];
    expect(added[0].conditions.map((condition) => condition.property)).toEqual([
      'hasEmail',
      'gone',
      'hasPhone',
    ]);
  });
});
