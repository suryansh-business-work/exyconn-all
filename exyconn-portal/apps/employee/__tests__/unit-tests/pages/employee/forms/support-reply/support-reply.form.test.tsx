import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useAddMySupportReplyMutation,
  useUploadImageMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { mutationTuple } from '../../apolloHookMocks';
import { SupportReplyForm } from '../../../../../../src/pages/employee/forms/support-reply';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAddMySupportReplyMutation: vi.fn(),
  useUploadImageMutation: vi.fn(),
}));

const CDN_URL = 'https://cdn.example.com/support/screen.png';
const addReply = vi.fn();
const uploadImage = vi.fn();

function setup() {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(<SupportReplyForm ticketId="ticket-9" onCancel={onCancel} onDone={onDone} />);
  return { onCancel, onDone };
}

const body = () => screen.getByLabelText('Your reply');
const send = () => userEvent.click(screen.getByRole('button', { name: 'Send reply' }));

async function attachScreenshot() {
  uploadImage.mockResolvedValue({ data: { uploadImage: CDN_URL } });
  const file = new File(['png-bytes'], 'screen.png', { type: 'image/png' });
  fireEvent.change(screen.getByTestId('attachment-input'), { target: { files: [file] } });
  expect(await screen.findByText('screen.png')).toBeInTheDocument();
}

beforeEach(() => {
  addReply.mockReset();
  uploadImage.mockReset();
  vi.mocked(useAddMySupportReplyMutation).mockReturnValue(
    mutationTuple<typeof useAddMySupportReplyMutation>(addReply),
  );
  vi.mocked(useUploadImageMutation).mockReturnValue(
    mutationTuple<typeof useUploadImageMutation>(uploadImage),
  );
});

describe('SupportReplyForm', () => {
  it('requires a reply', async () => {
    setup();
    await send();

    expect(await screen.findByText('Reply is required')).toBeInTheDocument();
    expect(addReply).not.toHaveBeenCalled();
  });

  it('keeps the reply under 4000 characters', async () => {
    setup();
    fireEvent.change(body(), { target: { value: 'r'.repeat(4001) } });
    await send();

    expect(await screen.findByText('Keep it under 4000 characters')).toBeInTheDocument();
    expect(addReply).not.toHaveBeenCalled();
  });

  it('sends a plain reply on the ticket with no attachments', async () => {
    addReply.mockResolvedValue({ data: { addMySupportReply: { id: 'reply-1' } } });
    const { onDone } = setup();
    await userEvent.type(body(), ' Still happening after the restart ');
    await send();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(addReply).toHaveBeenCalledWith({
      variables: {
        ticketId: 'ticket-9',
        body: 'Still happening after the restart',
        attachments: [],
      },
    });
    expect(await screen.findByText('Reply sent')).toBeInTheDocument();
    expect(body()).toHaveValue('');
  });

  it('sends the uploaded files with the reply, then clears them', async () => {
    addReply.mockResolvedValue({ data: { addMySupportReply: { id: 'reply-2' } } });
    setup();
    await attachScreenshot();
    await userEvent.type(body(), 'Screenshot attached');
    await send();

    await waitFor(() => expect(addReply).toHaveBeenCalledTimes(1));
    expect(addReply.mock.calls[0][0].variables.attachments).toEqual([
      { url: CDN_URL, name: 'screen.png', contentType: 'image/png' },
    ]);
    await waitFor(() => expect(screen.queryByText('screen.png')).toBeNull());
  });

  it('keeps the reply and files when sending fails', async () => {
    addReply.mockRejectedValue(new Error('Ticket is closed'));
    const { onDone } = setup();
    await attachScreenshot();
    await userEvent.type(body(), 'One more thing');
    await send();

    expect(await screen.findByText('Ticket is closed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(body()).toHaveValue('One more thing');
    expect(screen.getByText('screen.png')).toBeInTheDocument();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    addReply.mockRejectedValue('gateway');
    setup();
    await userEvent.type(body(), 'Any update?');
    await send();

    expect(await screen.findByText('Could not send the reply')).toBeInTheDocument();
  });

  it('cancels without sending', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
