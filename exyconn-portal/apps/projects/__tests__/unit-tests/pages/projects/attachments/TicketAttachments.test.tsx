import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TaskAttachmentFieldsFragment } from '@exyconn/shell/graphql/generated';
import { TicketAttachments } from '../../../../../src/pages/projects/attachments';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateTaskMutation: () => [gql.update],
}));

/** The picker has its own tests; here it hands over one uploaded file on a click. */
vi.mock('../../../../../src/pages/projects/attachments/AttachmentPicker', () => ({
  AttachmentPicker: ({ onPicked }: Readonly<{ onPicked: (file: object) => void }>) => (
    <button
      type="button"
      onClick={() =>
        onPicked({ url: 'https://ik.example/new.png', name: 'new.png', contentType: 'image/png' })
      }
    >
      Pick new.png
    </button>
  ),
}));

const attachment = (name: string, contentType: string): TaskAttachmentFieldsFragment => ({
  __typename: 'TaskAttachment',
  url: `https://ik.example/${name}`,
  name,
  contentType,
  uploadedByName: 'Asha Rao',
  uploadedAt: '2026-09-01T00:00:00.000Z',
});

const SPEC = attachment('spec.pdf', 'application/pdf');
const SHOT = attachment('shot.png', 'image/png');
const onChanged = vi.fn();

const renderList = (files: TaskAttachmentFieldsFragment[] = [SPEC, SHOT]) =>
  renderWithProviders(
    <TicketAttachments taskId="task-1" title="Login fails" files={files} onChanged={onChanged} />,
  );

const input = (file: TaskAttachmentFieldsFragment) => ({
  url: file.url,
  name: file.name,
  contentType: file.contentType,
});

describe('TicketAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.update.mockResolvedValue({ data: {} });
  });

  it('counts the files and says when there are none', () => {
    renderList([]);

    expect(screen.getByText('Attachments (0)')).toBeInTheDocument();
    expect(screen.getByText('Nothing attached yet.')).toBeInTheDocument();
  });

  it('saves a new file straight away, resending the summary and the files already there', async () => {
    renderList();
    expect(screen.getByText('Attachments (2)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pick new.png' }));

    expect(await screen.findByText('Attachment added')).toBeInTheDocument();
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'task-1',
        input: {
          title: 'Login fails',
          attachments: [
            input(SPEC),
            input(SHOT),
            { url: 'https://ik.example/new.png', name: 'new.png', contentType: 'image/png' },
          ],
        },
      },
    });
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('takes a file off after asking, keeping the others', async () => {
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Remove spec.pdf' }));
    expect(await screen.findByText('Remove "spec.pdf" from this ticket?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Attachment removed')).toBeInTheDocument();
    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'task-1', input: { title: 'Login fails', attachments: [input(SHOT)] } },
    });
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('leaves the file where it is when the removal is cancelled', async () => {
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Remove shot.png' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText(/from this ticket\?/)).not.toBeInTheDocument());
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('says why a save failed and does not report a change', async () => {
    gql.update.mockRejectedValueOnce(new Error('Ticket is locked'));
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Pick new.png' }));

    expect(await screen.findByText('Ticket is locked')).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('falls back to a general message for a failure that is not an Error', async () => {
    gql.update.mockRejectedValueOnce('offline');
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Pick new.png' }));

    expect(await screen.findByText('Could not save the attachment')).toBeInTheDocument();
  });
});
