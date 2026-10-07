import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAssignSupportTicketMutation, useListSupportAgentsQuery } from '@/graphql/generated';
import { TicketAssignee } from '@/pages/ticket-desk/TicketAssignee';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple, queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useListSupportAgentsQuery: vi.fn(),
  useAssignSupportTicketMutation: vi.fn(),
}));

const assign = vi.fn();
const agents = [
  { id: 'a-1', name: 'Asha', email: 'asha@example.com' },
  { id: 'a-2', name: 'Ben', email: 'ben@example.com' },
];

function renderAssignee(assigneeId: string, list: unknown[] | null = agents, loading = false) {
  vi.mocked(useListSupportAgentsQuery).mockReturnValue(
    queryResult(list ? { listSupportAgents: list } : undefined) as never,
  );
  vi.mocked(useAssignSupportTicketMutation).mockReturnValue(
    mutationTuple(assign, loading) as never,
  );
  const onAssigned = vi.fn();
  renderWithProviders(
    <TicketAssignee ticketId="t-1" assigneeId={assigneeId} category="IT" onAssigned={onAssigned} />,
  );
  return onAssigned;
}

async function choose(option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: 'Assigned to' }));
  await userEvent.click(within(screen.getByRole('listbox')).getByText(option));
}

beforeEach(() => {
  assign.mockReset().mockResolvedValue({ data: {} });
});

describe('TicketAssignee', () => {
  it("lists the category's agents and hands the ticket to one of them", async () => {
    const onAssigned = renderAssignee('');
    expect(useListSupportAgentsQuery).toHaveBeenCalledWith({ variables: { category: 'IT' } });

    await choose('Ben');

    expect(await screen.findByText('Assigned to Ben')).toBeInTheDocument();
    expect(assign).toHaveBeenCalledWith({ variables: { id: 't-1', assigneeId: 'a-2' } });
    expect(onAssigned).toHaveBeenCalledTimes(1);
  });

  it('puts the ticket back in the unassigned queue', async () => {
    const onAssigned = renderAssignee('a-1');
    expect(screen.getByRole('combobox', { name: 'Assigned to' })).toHaveTextContent('Asha');

    await choose('Unassigned');

    expect(await screen.findByText('Back in the unassigned queue')).toBeInTheDocument();
    expect(assign).toHaveBeenCalledWith({ variables: { id: 't-1', assigneeId: '' } });
    expect(onAssigned).toHaveBeenCalledTimes(1);
  });

  it('offers only the unassigned queue before the agents arrive', async () => {
    renderAssignee('', null);
    await userEvent.click(screen.getByRole('combobox', { name: 'Assigned to' }));
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
  });

  it("reports the server's reason when assigning fails", async () => {
    assign.mockRejectedValueOnce(new Error('Agent is away'));
    const onAssigned = renderAssignee('');
    await choose('Asha');
    expect(await screen.findByText('Agent is away')).toBeInTheDocument();
    expect(onAssigned).not.toHaveBeenCalled();
  });

  it('uses a generic message for a non-Error failure', async () => {
    assign.mockRejectedValueOnce('offline');
    renderAssignee('');
    await choose('Asha');
    expect(await screen.findByText('Could not assign')).toBeInTheDocument();
  });

  it('locks the picker while assigning', () => {
    renderAssignee('', agents, true);
    expect(screen.getByRole('combobox', { name: 'Assigned to' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
