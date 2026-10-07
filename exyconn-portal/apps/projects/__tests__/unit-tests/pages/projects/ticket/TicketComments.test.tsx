import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketComments } from '../../../../../src/pages/projects/ticket/TicketComments';
import { renderWithProviders } from '../../../test-utils';
import { commentFixture } from '../projects-fixtures';

const gql = vi.hoisted(() => ({
  comments: vi.fn(),
  refetch: vi.fn(),
  add: vi.fn(),
  adding: false,
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTaskCommentsQuery: (options: unknown) => gql.comments(options),
  useAddTaskCommentMutation: () => [gql.add, { loading: gql.adding }],
  useDeleteTaskCommentMutation: () => [gql.remove],
}));

vi.mock('../../../../../src/pages/projects/attachments', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/pages/projects/attachments')>()),
  AttachmentList: ({ files }: Readonly<{ files: ReadonlyArray<{ name: string }> }>) => (
    <ul aria-label="attachments">
      {files.map((file) => (
        <li key={file.name}>{file.name}</li>
      ))}
    </ul>
  ),
  AttachmentPicker: ({
    onPicked,
  }: Readonly<{
    onPicked: (file: { url: string; name: string; contentType: string }) => void;
  }>) => (
    <button
      type="button"
      onClick={() =>
        onPicked({
          url: 'https://files.test/spec.pdf',
          name: 'spec.pdf',
          contentType: 'application/pdf',
        })
      }
    >
      Attach
    </button>
  ),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value}` }),
}));

const BOX = 'Add a comment…';
const type = (text: string) =>
  fireEvent.change(screen.getByLabelText(BOX), { target: { value: text } });

describe('TicketComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.adding = false;
    gql.refetch.mockResolvedValue({});
    gql.add.mockResolvedValue({});
    gql.remove.mockResolvedValue({});
    gql.comments.mockReturnValue({
      data: { taskComments: [commentFixture()] },
      refetch: gql.refetch,
    });
  });

  it('shows each comment with its author, time and body', () => {
    renderWithProviders(<TicketComments taskId="task-1" />);

    expect(screen.getByText('Comments (1)')).toBeInTheDocument();
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByText('at 2026-10-02T09:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Looks good')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'attachments' })).not.toBeInTheDocument();
    expect(gql.comments).toHaveBeenCalledWith({ variables: { taskId: 'task-1' } });
  });

  it('lists the files a comment carries', () => {
    const file = {
      __typename: 'TaskAttachment' as const,
      url: 'https://files.test/a.png',
      name: 'a.png',
      contentType: 'image/png',
      uploadedByName: 'Asha Rao',
      uploadedAt: '2026-10-02T09:00:00.000Z',
    };
    gql.comments.mockReturnValue({
      data: { taskComments: [commentFixture({ attachments: [file] })] },
      refetch: gql.refetch,
    });
    renderWithProviders(<TicketComments taskId="task-1" />);

    expect(screen.getByText('a.png')).toBeInTheDocument();
  });

  it('says there are no comments before the first answer', () => {
    gql.comments.mockReturnValue({ data: undefined, refetch: gql.refetch });
    renderWithProviders(<TicketComments taskId="task-1" />);

    expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
  });

  it('will not post a blank comment', () => {
    renderWithProviders(<TicketComments taskId="task-1" />);

    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();
    type('   ');
    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();
  });

  it('is disabled while a comment is being sent', () => {
    gql.adding = true;
    renderWithProviders(<TicketComments taskId="task-1" />);
    type('Ready');

    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();
  });

  it('posts the trimmed comment with no file, then clears the box and reloads', async () => {
    renderWithProviders(<TicketComments taskId="task-1" />);
    type('  Ship it  ');

    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(gql.add).toHaveBeenCalledWith({
      variables: { taskId: 'task-1', body: 'Ship it', attachments: [] },
    });
    await waitFor(() => expect(screen.getByLabelText(BOX)).toHaveValue(''));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('sends one picked file with the comment and drops it afterwards', async () => {
    renderWithProviders(<TicketComments taskId="task-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Attach' }));
    expect(screen.getByText('spec.pdf')).toBeInTheDocument();
    type('See spec');

    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(gql.add).toHaveBeenCalledWith({
      variables: {
        taskId: 'task-1',
        body: 'See spec',
        attachments: [
          { url: 'https://files.test/spec.pdf', name: 'spec.pdf', contentType: 'application/pdf' },
        ],
      },
    });
    await waitFor(() => expect(screen.queryByText('spec.pdf')).not.toBeInTheDocument());
  });

  it('keeps the draft and says why when posting fails', async () => {
    gql.add.mockRejectedValueOnce(new Error('Ticket is closed'));
    renderWithProviders(<TicketComments taskId="task-1" />);
    type('Late note');

    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(await screen.findByText('Ticket is closed')).toBeInTheDocument();
    expect(screen.getByLabelText(BOX)).toHaveValue('Late note');
    expect(gql.refetch).not.toHaveBeenCalled();
  });
});
