import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ClientCommunicationType,
  CreateClientCommunicationDocument,
  UpdateClientCommunicationDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import {
  ClientCommunicationForm,
  clientCommunicationDefaults,
} from '../../../../../src/pages/clients/detail/forms/client-communication';
import { CLIENT_ID, communication } from './client-detail.fixtures';

const NOW = new Date('2026-10-05T09:00:00.000Z');

describe('ClientCommunicationForm', () => {
  it('starts as a call happening now', () => {
    expect(clientCommunicationDefaults(null, NOW)).toMatchObject({
      type: ClientCommunicationType.Call,
      occurredAt: NOW.toISOString(),
      notify: false,
    });
  });

  it('needs a subject', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClientCommunicationForm
        clientId={CLIENT_ID}
        initial={null}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Say what it was about')).toBeInTheDocument();
  });

  it('logs an entry', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const user = userEvent.setup();
    const onDone = vi.fn();
    const input = { ...clientCommunicationDefaults(null, NOW), subject: 'Pricing call' };
    renderWithProviders(
      <ClientCommunicationForm
        clientId={CLIENT_ID}
        initial={null}
        onDone={onDone}
        onCancel={vi.fn()}
      />,
      {
        mocks: [
          {
            request: {
              query: CreateClientCommunicationDocument,
              variables: { clientId: CLIENT_ID, input },
            },
            result: { data: { createClientCommunication: communication() } },
          },
        ],
      },
    );
    await user.type(screen.getByRole('textbox', { name: 'Subject' }), 'Pricing call');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Communication created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('edits an entry the client was already told about, without telling them again', async () => {
    const user = userEvent.setup();
    const entry = communication({ notifiedAt: '2026-10-02T11:00:00.000Z' });
    const input = { ...clientCommunicationDefaults(entry, NOW), summary: 'Agreed the scope.' };
    renderWithProviders(
      <ClientCommunicationForm
        clientId={CLIENT_ID}
        initial={entry}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
      {
        mocks: [
          {
            request: {
              query: UpdateClientCommunicationDocument,
              variables: { id: 'comm-1', input },
            },
            result: { data: { updateClientCommunication: entry } },
          },
        ],
      },
    );
    expect(screen.queryByRole('switch', { name: /Email the client/ })).toBeNull();
    await user.type(screen.getByRole('textbox', { name: 'Summary' }), '.');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Communication updated')).toBeInTheDocument();
  });
});
