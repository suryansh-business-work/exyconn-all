import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  CreateWebhookDocument,
  DeleteWebhookDocument,
  ListWebhooksDocument,
  SetWebhookActiveDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { WebhooksPanel } from '../../../../src/pages/integrations/WebhooksPanel';
import { oneTimeValue, webhook } from './integrations.fixtures';

const EVENTS = ['lead.created', 'invoice.paid', 'ticket.closed'];

const list = (rows = [webhook()], delay = 0): MockLink.MockedResponse => ({
  request: { query: ListWebhooksDocument },
  result: { data: { listWebhooks: rows, webhookEvents: EVENTS } },
  delay,
});

const createVars = {
  name: 'Billing',
  url: 'https://billing.example.com/in',
  events: ['invoice.paid'],
};

const toggled = (error?: Error): MockLink.MockedResponse => ({
  request: { query: SetWebhookActiveDocument, variables: { id: 'hook-1', active: false } },
  ...(error ? { error } : { result: { data: { setWebhookActive: webhook({ active: false }) } } }),
});

const deleted = (error?: Error): MockLink.MockedResponse => ({
  request: { query: DeleteWebhookDocument, variables: { id: 'hook-1' } },
  ...(error ? { error } : { result: { data: { deleteWebhook: true } } }),
});

const confirmDialog = async () => within(await screen.findByRole('dialog'));

describe('WebhooksPanel', () => {
  it('shows a loader, then each endpoint with its events, deliveries and failures', async () => {
    const { container } = renderWithProviders(<WebhooksPanel />, {
      mocks: [
        list(
          [
            webhook(),
            webhook({ id: 'hook-2', name: 'Spare', lastDeliveredAt: null, failureCount: 3 }),
          ],
          20,
        ),
      ],
    });
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    const row = (await screen.findByText('CRM bridge')).closest('tr') as HTMLElement;
    expect(within(row).getByText('https://crm.example.com/hooks')).toBeInTheDocument();
    expect(within(row).getByText('lead.created, invoice.paid')).toBeInTheDocument();
    expect(within(row).getByText(/Sep 2026/)).toBeInTheDocument();
    expect(within(row).queryByText(/failing/)).toBeNull();
    expect(screen.getByRole('switch', { name: 'Enable CRM bridge' })).toBeChecked();
    expect(screen.getByText('Never · 3 failing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ticket.closed' })).toBeInTheDocument();
  });

  it('adds an endpoint with the trimmed fields and shows its secret once', async () => {
    const user = userEvent.setup();
    const signing = oneTimeValue('whsec');
    renderWithProviders(<WebhooksPanel />, {
      mocks: [
        list(),
        {
          request: { query: CreateWebhookDocument, variables: createVars },
          result: {
            data: {
              createWebhook: {
                __typename: 'CreatedWebhook',
                secret: signing,
                webhook: webhook({ id: 'hook-3', name: 'Billing' }),
              },
            },
          },
        },
        list([webhook(), webhook({ id: 'hook-3', name: 'Billing' })]),
      ],
    });
    await screen.findByText('CRM bridge');
    await user.type(screen.getByLabelText('Name'), ' Billing ');
    await user.type(screen.getByLabelText('HTTPS endpoint'), ' https://billing.example.com/in ');
    await user.click(screen.getByRole('button', { name: 'lead.created' }));
    await user.click(screen.getByRole('button', { name: 'invoice.paid' }));
    await user.click(screen.getByRole('button', { name: 'lead.created' }));
    await user.click(screen.getByRole('button', { name: 'Add endpoint' }));

    expect(await screen.findByText(signing)).toBeInTheDocument();
    expect(
      screen.getByText('Copy this signing secret now — it is never shown again.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('HTTPS endpoint')).toHaveValue('');
    expect(await screen.findByText('Billing')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(signing)).toBeNull());
  });

  it('says why an endpoint could not be added', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WebhooksPanel />, {
      mocks: [
        list(),
        {
          request: { query: CreateWebhookDocument, variables: { name: '', url: '', events: [] } },
          error: new Error('Use an HTTPS address'),
        },
      ],
    });
    await screen.findByText('CRM bridge');
    await user.click(screen.getByRole('button', { name: 'Add endpoint' }));
    expect(await screen.findByText('Use an HTTPS address')).toBeInTheDocument();
  });

  it('pauses an endpoint from its switch and reloads the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WebhooksPanel />, {
      mocks: [list(), toggled(), list([webhook({ active: false })])],
    });
    await user.click(await screen.findByRole('switch', { name: 'Enable CRM bridge' }));
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Enable CRM bridge' })).not.toBeChecked(),
    );
  });

  it('says why the switch could not change the endpoint', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WebhooksPanel />, {
      mocks: [list(), toggled(new Error('Endpoint is gone'))],
    });
    await user.click(await screen.findByRole('switch', { name: 'Enable CRM bridge' }));
    expect(await screen.findByText('Endpoint is gone')).toBeInTheDocument();
  });

  it('deletes an endpoint only once confirmed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WebhooksPanel />, { mocks: [list(), deleted(), list([])] });
    await user.click(await screen.findByRole('button', { name: 'delete' }));
    const first = await confirmDialog();
    expect(
      first.getByText('Delete this endpoint? Deliveries to it stop at once.'),
    ).toBeInTheDocument();
    await user.click(first.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('CRM bridge')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'delete' }));
    await user.click((await confirmDialog()).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByText('CRM bridge')).toBeNull());
  });

  it('says why an endpoint could not be deleted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WebhooksPanel />, {
      mocks: [list(), deleted(new Error('Delete refused'))],
    });
    await user.click(await screen.findByRole('button', { name: 'delete' }));
    await user.click((await confirmDialog()).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete refused')).toBeInTheDocument();
    expect(screen.getByText('CRM bridge')).toBeInTheDocument();
  });
});
