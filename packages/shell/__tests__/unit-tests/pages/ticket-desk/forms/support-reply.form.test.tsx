import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SupportCategory,
  useAddSupportReplyMutation,
  useListActiveCannedRepliesQuery,
  useUploadImageMutation,
} from '@/graphql/generated';
import { SupportReplyForm } from '@/pages/ticket-desk';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple, queryResult } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useAddSupportReplyMutation: vi.fn(),
  useListActiveCannedRepliesQuery: vi.fn(),
  useUploadImageMutation: vi.fn(),
}));

const addReply = vi.fn();
const upload = vi.fn();
const FILE_URL = 'https://cdn.example.com/screen.png';

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<SupportReplyForm ticketId="t-1" onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

const message = () => screen.getByRole('textbox', { name: 'Message' });

async function write(text: string) {
  await userEvent.click(message());
  await userEvent.paste(text);
}

async function choose(field: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: field }));
  await userEvent.click(within(screen.getByRole('listbox')).getByText(option));
}

const send = () => userEvent.click(screen.getByRole('button', { name: 'Send' }));

beforeEach(() => {
  addReply.mockReset().mockResolvedValue({ data: {} });
  upload.mockReset().mockResolvedValue({ data: { uploadImage: FILE_URL } });
  vi.mocked(useAddSupportReplyMutation).mockReturnValue(mutationTuple(addReply) as never);
  vi.mocked(useUploadImageMutation).mockReturnValue(mutationTuple(upload) as never);
  vi.mocked(useListActiveCannedRepliesQuery).mockReturnValue(
    queryResult({
      listActiveCannedReplies: [
        {
          id: 'c-1',
          title: 'Greeting',
          category: SupportCategory.It,
          body: 'Hi there,',
          isActive: true,
        },
      ],
    }) as never,
  );
});

describe('SupportReplyForm', () => {
  it('will not send an empty message', async () => {
    renderForm();
    await send();
    expect(await screen.findByText('Write something before sending')).toBeInTheDocument();
    expect(addReply).not.toHaveBeenCalled();
  });

  it('replies to the requester by default with the files attached, then clears', async () => {
    const { onDone } = renderForm();
    await write('Fixed now.');
    await userEvent.upload(
      screen.getByTestId('attachment-input'),
      new File(['png'], 'screen.png', { type: 'image/png' }),
    );
    expect(await screen.findByText('screen.png')).toBeInTheDocument();
    await send();

    expect(await screen.findByText('Reply sent')).toBeInTheDocument();
    expect(addReply).toHaveBeenCalledWith({
      variables: {
        ticketId: 't-1',
        body: 'Fixed now.',
        internal: false,
        attachments: [{ url: FILE_URL, name: 'screen.png', contentType: 'image/png' }],
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(message()).toHaveValue('');
    expect(screen.queryByText('screen.png')).toBeNull();
  });

  it('posts an internal note and keeps that visibility for the next message', async () => {
    renderForm();
    await choose('Visibility', 'Internal note (team only)');
    await write('Customer is on the old plan.');
    await send();

    expect(await screen.findByText('Internal note added')).toBeInTheDocument();
    expect(addReply.mock.calls[0][0].variables).toMatchObject({ internal: true, attachments: [] });
    expect(screen.getByRole('combobox', { name: 'Visibility' })).toHaveTextContent(
      'Internal note (team only)',
    );
  });

  it('drops a snippet into an empty message, and appends one to words already typed', async () => {
    renderForm();
    await choose('Insert a canned reply', 'Greeting');
    expect(message()).toHaveValue('Hi there,');

    await userEvent.clear(message());
    await write('  Thanks for waiting.  ');
    await choose('Insert a canned reply', 'Greeting');
    expect(message()).toHaveValue('Thanks for waiting.\n\nHi there,');
  });

  it("reports the server's reason and keeps the message", async () => {
    addReply.mockRejectedValueOnce(new Error('Ticket is closed'));
    const { onDone } = renderForm();
    await write('Fixed now.');
    await send();

    expect(await screen.findByText('Ticket is closed')).toBeInTheDocument();
    expect(message()).toHaveValue('Fixed now.');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('uses a generic message for a non-Error failure', async () => {
    addReply.mockRejectedValueOnce('offline');
    renderForm();
    await write('Fixed now.');
    await send();
    expect(await screen.findByText('Could not send')).toBeInTheDocument();
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
