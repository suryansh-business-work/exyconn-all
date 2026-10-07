import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SupportCategory,
  SupportPriority,
  useCreateSupportTicketMutation,
  useUploadImageMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { mutationTuple } from '../../apolloHookMocks';
import { SupportTicketForm } from '../../../../../../src/pages/employee/forms/support-ticket';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateSupportTicketMutation: vi.fn(),
  useUploadImageMutation: vi.fn(),
}));

const CDN_URL = 'https://cdn.example.com/support/error.pdf';
const createTicket = vi.fn();
const uploadImage = vi.fn();

function setup() {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(<SupportTicketForm onCancel={onCancel} onDone={onDone} />);
  return { onCancel, onDone };
}

const raise = () => userEvent.click(screen.getByRole('button', { name: 'Raise ticket' }));

async function fillValid() {
  await userEvent.type(screen.getByLabelText('Subject'), ' VPN drops ');
  await userEvent.type(screen.getByLabelText('Description'), 'Disconnects every ten minutes.');
}

async function pickOption(field: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: field }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

beforeEach(() => {
  createTicket.mockReset();
  uploadImage.mockReset();
  vi.mocked(useCreateSupportTicketMutation).mockReturnValue(
    mutationTuple<typeof useCreateSupportTicketMutation>(createTicket),
  );
  vi.mocked(useUploadImageMutation).mockReturnValue(
    mutationTuple<typeof useUploadImageMutation>(uploadImage),
  );
});

describe('SupportTicketForm', () => {
  it('requires a subject and a description', async () => {
    setup();
    await raise();

    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });

  it('asks for a fuller subject and description', async () => {
    setup();
    await userEvent.type(screen.getByLabelText('Subject'), 'VP');
    await userEvent.type(screen.getByLabelText('Description'), 'Broken');
    await raise();

    expect(await screen.findByText('Add a short subject')).toBeInTheDocument();
    expect(screen.getByText('Describe the issue in a bit more detail')).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });

  it('raises an IT ticket at medium priority by default and resets after', async () => {
    createTicket.mockResolvedValue({ data: { createSupportTicket: { id: 'ticket-1' } } });
    const { onDone } = setup();
    expect(screen.getByRole('combobox', { name: /Category/ })).toHaveTextContent('It');
    expect(screen.getByRole('combobox', { name: /Priority/ })).toHaveTextContent('Medium');
    await fillValid();
    await raise();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(createTicket).toHaveBeenCalledWith({
      variables: {
        input: {
          subject: 'VPN drops',
          category: SupportCategory.It,
          description: 'Disconnects every ten minutes.',
          priority: SupportPriority.Medium,
          attachments: [],
        },
      },
    });
    expect(await screen.findByText('Support ticket raised')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toHaveValue('');
  });

  it('raises the picked category and priority with the uploaded files', async () => {
    createTicket.mockResolvedValue({ data: { createSupportTicket: { id: 'ticket-2' } } });
    uploadImage.mockResolvedValue({ data: { uploadImage: CDN_URL } });
    setup();
    await pickOption(/Category/, 'Payroll');
    await pickOption(/Priority/, 'High');
    const file = new File(['%PDF'], 'error.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('attachment-input'), { target: { files: [file] } });
    expect(await screen.findByText('error.pdf')).toBeInTheDocument();
    await fillValid();
    await raise();

    await waitFor(() => expect(createTicket).toHaveBeenCalledTimes(1));
    const { input } = createTicket.mock.calls[0][0].variables;
    expect(input.category).toBe(SupportCategory.Payroll);
    expect(input.priority).toBe(SupportPriority.High);
    expect(input.attachments).toEqual([
      { url: CDN_URL, name: 'error.pdf', contentType: 'application/pdf' },
    ]);
    await waitFor(() => expect(screen.queryByText('error.pdf')).toBeNull());
  });

  it('shows the server’s message when raising fails', async () => {
    createTicket.mockRejectedValue(new Error('Support desk is offline'));
    const { onDone } = setup();
    await fillValid();
    await raise();

    expect(await screen.findByText('Support desk is offline')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    createTicket.mockRejectedValue(42);
    setup();
    await fillValid();
    await raise();

    expect(await screen.findByText('Could not raise support ticket')).toBeInTheDocument();
  });

  it('cancels without raising', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
