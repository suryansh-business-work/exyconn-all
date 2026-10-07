import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterOp } from '@/graphql/generated';
import {
  EMPLOYEE_DESK_FILTERS,
  TicketQuickFilter,
  quickFilters,
  type QuickFilter,
} from '@/pages/ticket-desk';
import { renderWithProviders } from '../../test-utils';

const equals = (field: string, value: string) => [{ field, op: FilterOp.Equals, value }];

describe('quickFilters', () => {
  it('adds no filter for All', () => {
    expect(quickFilters('all', 'me')).toEqual([]);
  });

  it.each<[QuickFilter, ReturnType<typeof equals>]>([
    ['unassigned', equals('assigneeId', '')],
    ['mine', equals('assigneeId', 'agent-7')],
    ['open', equals('status', 'OPEN')],
    ['overdue', equals('slaState', 'BREACHED')],
    ['customers', equals('requesterType', 'CLIENT')],
    ['employees', equals('requesterType', 'EMPLOYEE')],
    ['emailed', equals('channel', 'EMAIL')],
  ])('turns %s into one server-side condition', (filter, expected) => {
    expect(quickFilters(filter, 'agent-7')).toEqual(expected);
  });

  it("keeps IT's desk to the employee views", () => {
    expect(EMPLOYEE_DESK_FILTERS).toEqual(['all', 'unassigned', 'mine', 'open', 'overdue']);
  });
});

describe('TicketQuickFilter', () => {
  it('offers every view by default and reports a new choice', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TicketQuickFilter value="all" onChange={onChange} />);

    const group = screen.getByRole('group', { name: 'Quick filter' });
    expect(group.querySelectorAll('button')).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Emailed in' }));
    expect(onChange).toHaveBeenCalledWith('emailed');
  });

  it('ignores a click on the view already chosen, so one is always selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TicketQuickFilter value="mine" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Mine' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('offers only the views it is told to', () => {
    renderWithProviders(
      <TicketQuickFilter value="all" onChange={vi.fn()} only={EMPLOYEE_DESK_FILTERS} />,
    );
    expect(screen.getByRole('button', { name: 'Overdue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Customers' })).toBeNull();
  });
});
