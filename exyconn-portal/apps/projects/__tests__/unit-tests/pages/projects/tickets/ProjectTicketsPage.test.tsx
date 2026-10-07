import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskType } from '@exyconn/shell/graphql/generated';
import { ProjectTicketsPage } from '../../../../../src/pages/projects/tickets';
import type { TicketRow } from '../../../../../src/pages/projects/forms/ticket';
import { renderWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';
import { optionsOf, pickOption } from '../../../helpers/form-helpers';

const gql = vi.hoisted(() => ({ tasks: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectTasksQuery: (options: unknown) => gql.tasks(options),
}));

vi.mock('../../../../../src/pages/projects/ticket', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/pages/projects/ticket')>()),
  TicketDialog: ({
    ticket,
    onClose,
    onChanged,
  }: Readonly<{ ticket: TicketRow | null; onClose: () => void; onChanged: () => void }>) =>
    ticket ? (
      <section aria-label={`Ticket ${ticket.key}`}>
        <button type="button" onClick={onClose}>
          Close dialog
        </button>
        <button type="button" onClick={onChanged}>
          Ticket changed
        </button>
      </section>
    ) : null,
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => value.slice(0, 10) }),
}));

const ROWS = [
  taskRow({
    id: 't1',
    key: 'EXY-1',
    title: 'Login fails',
    type: TaskType.Bug,
    assigneeName: 'Priya',
  }),
  taskRow({
    id: 't2',
    key: 'EXY-2',
    title: 'Add dark mode',
    type: TaskType.Story,
    assigneeName: 'Asha',
  }),
  taskRow({ id: 't3', key: 'EXY-3', title: 'Tidy styles', type: TaskType.Task, assigneeName: '' }),
  taskRow({
    id: 't4',
    key: 'EXY-4',
    title: 'Fix footer',
    type: TaskType.Bug,
    assigneeName: 'Priya',
  }),
];

/** The summaries of the rows on screen, top to bottom. */
const visibleTitles = () =>
  ROWS.map((row) => row.title).filter((title) => screen.queryByText(title) !== null);

describe('ProjectTicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.tasks.mockReturnValue({
      data: { projectTasks: ROWS },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('lists every ticket of the project', () => {
    renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);

    expect(visibleTitles()).toEqual(['Login fails', 'Add dark mode', 'Tidy styles', 'Fix footer']);
    expect(gql.tasks).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('filters by summary or key, ignoring case and surrounding spaces', () => {
    renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '  DARK ' } });
    expect(visibleTitles()).toEqual(['Add dark mode']);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'exy-3' } });
    expect(visibleTitles()).toEqual(['Tidy styles']);
  });

  it('offers every type and each named assignee once, in order', async () => {
    renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);

    expect(await optionsOf(/Type/)).toEqual(['All types', 'Story', 'Task', 'Bug', 'Epic']);
    expect(await optionsOf(/Assignee/)).toEqual(['Anyone', 'Asha', 'Priya']);
  });

  it('narrows by type and by assignee together, and widens again on "All types"', async () => {
    renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);

    await pickOption(/Type/, 'Bug');
    expect(visibleTitles()).toEqual(['Login fails', 'Fix footer']);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'footer' } });
    await pickOption(/Assignee/, 'Priya');
    expect(visibleTitles()).toEqual(['Fix footer']);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '' } });
    await pickOption(/Type/, 'All types');
    expect(visibleTitles()).toEqual(['Login fails', 'Fix footer']);
  });

  it('says so when nothing matches', () => {
    renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'nothing like this' } });

    expect(screen.getByText('No tickets match.')).toBeInTheDocument();
  });

  it('opens a row in the ticket dialog, reloads on a change and closes it again', async () => {
    renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);
    expect(screen.queryByRole('region', { name: /Ticket/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Add dark mode'));
    const dialog = screen.getByRole('region', { name: 'Ticket EXY-2' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ticket changed' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('region', { name: /Ticket/ })).not.toBeInTheDocument();
  });

  it('keeps the list when the reload after a change fails', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('offline'));
    renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);

    await userEvent.click(screen.getByText('Login fails'));
    await userEvent.click(screen.getByRole('button', { name: 'Ticket changed' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('region', { name: 'Ticket EXY-1' })).toBeInTheDocument();
  });

  it('shows no rows before the first answer, and refreshes on request', async () => {
    gql.tasks.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    const { rerender } = renderWithProviders(<ProjectTicketsPage projectId="proj-1" />);

    expect(visibleTitles()).toEqual([]);
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();

    gql.tasks.mockReturnValue({ data: { projectTasks: [] }, loading: false, refetch: gql.refetch });
    rerender(<ProjectTicketsPage projectId="proj-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
