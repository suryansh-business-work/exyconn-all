import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ClientEmailRecipientsDocument,
  EmailClientDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { EmailClientForm } from '../../../../../src/pages/clients/detail/forms/email-client';
import { CLIENT_ID } from './client-detail.fixtures';

const recipients = {
  request: { query: ClientEmailRecipientsDocument, variables: { clientId: CLIENT_ID } },
  result: {
    data: {
      clientEmailRecipients: [
        { __typename: 'ClientEmailRecipient', name: 'Acme', email: 'billing@acme.example' },
        { __typename: 'ClientEmailRecipient', name: 'Dana', email: 'dana@acme.example' },
      ],
    },
  },
};
const INPUT = {
  to: ['billing@acme.example', 'dana@acme.example'],
  subject: 'Renewal',
  message: 'Due next month',
};

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: 'Subject' }), INPUT.subject);
  await user.type(screen.getByRole('textbox', { name: 'Message' }), INPUT.message);
  await user.click(screen.getByRole('button', { name: 'Send' }));
};

describe('EmailClientForm', () => {
  it('needs a subject and a message', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EmailClientForm clientId={CLIENT_ID} onDone={vi.fn()} onCancel={vi.fn()} />,
      { mocks: [recipients] },
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Write a subject')).toBeInTheDocument();
    expect(screen.getByText('Write a message')).toBeInTheDocument();
  });

  it('sends to everyone on file by default and says how many got it', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    renderWithProviders(
      <EmailClientForm clientId={CLIENT_ID} onDone={onDone} onCancel={vi.fn()} />,
      {
        mocks: [
          recipients,
          {
            request: {
              query: EmailClientDocument,
              variables: { clientId: CLIENT_ID, input: INPUT },
            },
            result: { data: { emailClient: 2 } },
          },
        ],
      },
    );
    expect(await screen.findByText(/Dana <dana@acme.example>/)).toBeInTheDocument();
    await fill(user);

    expect(await screen.findByText('Email sent to 2 people')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('keeps the form open and says why when sending fails', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    renderWithProviders(
      <EmailClientForm clientId={CLIENT_ID} onDone={onDone} onCancel={vi.fn()} />,
      {
        mocks: [
          recipients,
          {
            request: {
              query: EmailClientDocument,
              variables: { clientId: CLIENT_ID, input: INPUT },
            },
            error: new Error('SMTP down'),
          },
        ],
      },
    );
    await screen.findByText(/Dana <dana@acme.example>/);
    await fill(user);

    expect(await screen.findByText('SMTP down')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('says so when the addresses cannot be loaded', async () => {
    renderWithProviders(
      <EmailClientForm clientId={CLIENT_ID} onDone={vi.fn()} onCancel={vi.fn()} />,
      { mocks: [{ request: recipients.request, error: new Error('Client not found') }] },
    );

    await waitFor(() => expect(screen.getByText('Client not found')).toBeInTheDocument());
  });
});
