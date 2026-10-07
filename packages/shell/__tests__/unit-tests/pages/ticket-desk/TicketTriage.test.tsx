import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSetSupportTicketTriageMutation } from '@/graphql/generated';
import { TicketTriage } from '@/pages/ticket-desk/TicketTriage';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useSetSupportTicketTriageMutation: vi.fn(),
}));

const setTriage = vi.fn();

function renderTriage(topics?: readonly string[], loading = false) {
  vi.mocked(useSetSupportTicketTriageMutation).mockReturnValue(
    mutationTuple(setTriage, loading) as never,
  );
  const onChanged = vi.fn();
  renderWithProviders(
    <TicketTriage
      ticketId="t-1"
      category="HR"
      priority="LOW"
      topic=""
      topics={topics}
      onChanged={onChanged}
    />,
  );
  return onChanged;
}

async function choose(field: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: field }));
  await userEvent.click(within(screen.getByRole('listbox')).getByText(option));
}

beforeEach(() => {
  setTriage.mockReset().mockResolvedValue({ data: {} });
});

describe('TicketTriage', () => {
  it('moves a ticket to another team and keeps showing the new choice', async () => {
    const onChanged = renderTriage();
    expect(screen.queryByRole('combobox', { name: 'Topic' })).toBeNull();

    await choose('Category', 'It');

    expect(await screen.findByText('Ticket triage updated')).toBeInTheDocument();
    expect(setTriage).toHaveBeenCalledWith({
      variables: { id: 't-1', category: 'IT', priority: 'LOW', topic: undefined },
    });
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('It');
  });

  it('changes the priority, keeping the category', async () => {
    renderTriage();
    await choose('Priority', 'High');
    await expect.poll(() => setTriage.mock.calls.length).toBe(1);
    expect(setTriage.mock.calls[0][0].variables).toMatchObject({
      category: 'HR',
      priority: 'HIGH',
    });
  });

  it("sends the topic on a desk that triages by topic, offering the desk's list", async () => {
    renderTriage(['Laptop', 'Network']);

    await userEvent.click(screen.getByRole('combobox', { name: 'Topic' }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['No topic', 'Laptop', 'Network']);
    await userEvent.click(options[2]);

    await expect.poll(() => setTriage.mock.calls.length).toBe(1);
    expect(setTriage.mock.calls[0][0].variables.topic).toBe('Network');
  });

  it("reports the server's reason and keeps the old choice when triage fails", async () => {
    setTriage.mockRejectedValueOnce(new Error('Ticket is closed'));
    const onChanged = renderTriage();
    await choose('Category', 'It');

    expect(await screen.findByText('Ticket is closed')).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Hr');
  });

  it('uses a generic message for a non-Error failure', async () => {
    setTriage.mockRejectedValueOnce('offline');
    renderTriage();
    await choose('Priority', 'Medium');
    expect(await screen.findByText('Could not update')).toBeInTheDocument();
  });

  it('locks the selects while a save is in flight', () => {
    renderTriage(['Laptop'], true);
    for (const name of ['Category', 'Priority', 'Topic']) {
      expect(screen.getByRole('combobox', { name })).toHaveAttribute('aria-disabled', 'true');
    }
  });
});
