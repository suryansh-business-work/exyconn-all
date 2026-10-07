import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketDialog } from '../../../../../src/pages/projects/ticket';
import { renderWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';
import { pickOption } from '../../../helpers/form-helpers';

const m = vi.hoisted(() => ({
  members: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  onChanged: null as null | (() => void),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListProjectMembersQuery: () => m.members(),
}));

vi.mock('../../../../../src/pages/projects/ticket/useTicket', () => ({
  useTicket: (onChanged: () => void) => {
    m.onChanged = onChanged;
    return { save: m.save, remove: m.remove, saving: false };
  },
}));

vi.mock('../../../../../src/pages/projects/forms/ticket', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/pages/projects/forms/ticket')>()),
  TicketForm: (await import('./ticket-dialog.mocks')).TicketFormStub,
}));

vi.mock('../../../../../src/pages/projects/ticket/TicketComments', () => ({
  TicketComments: ({ taskId }: Readonly<{ taskId: string }>) => <p>{`Comments on ${taskId}`}</p>,
}));

vi.mock('../../../../../src/pages/projects/ticket/TicketActivity', () => ({
  TicketActivity: ({ taskId }: Readonly<{ taskId: string }>) => <p>{`History of ${taskId}`}</p>,
}));

vi.mock('../../../../../src/pages/projects/attachments', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/pages/projects/attachments')>()),
  TicketAttachments: ({ taskId, title }: Readonly<{ taskId: string; title: string }>) => (
    <p>{`Files of ${taskId} (${title})`}</p>
  ),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value}` }),
}));

const TICKET = taskRow();
const PROMPT = 'Delete EXY-1 — "Login fails"?';

function open(extra: Partial<Parameters<typeof TicketDialog>[0]> = {}) {
  const props = { ticket: TICKET, onClose: vi.fn(), onChanged: vi.fn(), ...extra };
  renderWithProviders(<TicketDialog {...props} />);
  return props;
}

describe('TicketDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.save.mockResolvedValue(true);
    m.remove.mockResolvedValue(true);
    m.members.mockReturnValue({
      data: { listProjectMembers: [{ id: 'emp-1', name: 'Priya', email: 'priya@example.test' }] },
    });
  });

  it('renders nothing without a ticket', () => {
    renderWithProviders(<TicketDialog ticket={null} onClose={vi.fn()} onChanged={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('heads the ticket with its key, facets and reporter, over the form, files and comments', () => {
    const { onChanged } = open();

    expect(screen.getByText('EXY-1')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Priority: High' })).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(
      screen.getByText('Reported by Asha Rao · updated at 2026-09-01T00:00:00.000Z'),
    ).toBeInTheDocument();
    expect(screen.getByText('Form for EXY-1 with Priya')).toBeInTheDocument();
    expect(screen.getByText('Files of task-1 (Login fails)')).toBeInTheDocument();
    expect(screen.getByText('Comments on task-1')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Column/ })).not.toBeInTheDocument();
    expect(m.onChanged).toBe(onChanged);
  });

  it('credits a reporter who has left, and offers no assignees before members load', () => {
    m.members.mockReturnValue({ data: undefined });
    open({ ticket: taskRow({ reporterName: '' }) });

    expect(screen.getByText(/^Reported by somebody who has left/)).toBeInTheDocument();
    expect(screen.getByText('Form for EXY-1 with nobody')).toBeInTheDocument();
  });

  it('switches between the conversation and the history', async () => {
    open();

    await userEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByText('History of task-1')).toBeInTheDocument();
    expect(screen.queryByText('Comments on task-1')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Comments' }));
    expect(screen.getByText('Comments on task-1')).toBeInTheDocument();
  });

  it('saves through the ticket hook and closes only when the save worked', async () => {
    const { onClose } = open();

    m.save.mockResolvedValueOnce(false);
    await userEvent.click(screen.getByRole('button', { name: 'Save ticket' }));
    expect(m.save).toHaveBeenCalledWith('task-1', { title: 'Edited' });
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Save ticket' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('closes from the close button and from the form cancel', async () => {
    const { onClose } = open();

    await userEvent.click(screen.getByRole('button', { name: 'Close ticket' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel ticket' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('deletes after confirming and closes once the delete went through', async () => {
    const { onClose } = open();

    await userEvent.click(screen.getByRole('button', { name: 'Delete ticket' }));
    expect(await screen.findByText(PROMPT)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(m.remove).toHaveBeenCalledWith('task-1');
  });

  it('stays open when the delete fails or the person backs out', async () => {
    m.remove.mockResolvedValueOnce(false);
    const { onClose } = open();

    await userEvent.click(screen.getByRole('button', { name: 'Delete ticket' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(m.remove).toHaveBeenCalledTimes(1));

    await userEvent.click(await screen.findByRole('button', { name: 'Delete ticket' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText(PROMPT)).not.toBeInTheDocument());

    expect(m.remove).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('moves the ticket to another column when opened from the board', async () => {
    const onMove = vi.fn();
    open({
      board: {
        columns: [
          { id: 'todo', name: 'To do' },
          { id: 'done', name: 'Done' },
        ],
        onMove,
      },
    });

    expect(screen.getByRole('combobox', { name: /Column/ })).toHaveTextContent('To do');
    await pickOption(/Column/, 'Done');

    expect(onMove).toHaveBeenCalledWith('task-1', 'done');
  });
});
