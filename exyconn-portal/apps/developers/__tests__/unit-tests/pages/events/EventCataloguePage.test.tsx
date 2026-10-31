import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { WebhookEventCatalogueDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { EventCataloguePage } from '../../../../src/pages/events/EventCataloguePage';

const event = (name: string, module: string, fields: string[]) => ({
  __typename: 'WebhookEventInfo',
  event: name,
  module,
  description: `${name} happened.`,
  fields,
});

const catalogue = (rows = [event('invoice.paid', 'Finance', ['invoiceId', 'amount'])], delay = 0) =>
  ({
    request: { query: WebhookEventCatalogueDocument },
    result: { data: { webhookEventCatalogue: rows } },
    delay,
  }) satisfies MockLink.MockedResponse;

describe('EventCataloguePage', () => {
  it('explains the signature, then lists each event with its module and data fields', async () => {
    const { container } = renderWithProviders(<EventCataloguePage />, {
      mocks: [catalogue(undefined, 20)],
    });
    expect(screen.getByRole('heading', { name: 'Event catalogue' })).toBeInTheDocument();
    expect(screen.getByText(/x-exyconn-signature header/)).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();

    const row = (await screen.findByText('invoice.paid')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Finance')).toBeInTheDocument();
    expect(within(row).getByText('invoice.paid happened.')).toBeInTheDocument();
    expect(within(row).getByText('invoiceId, amount')).toBeInTheDocument();
  });

  it('reads the catalogue again on refresh', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventCataloguePage />, {
      mocks: [
        catalogue(),
        catalogue([
          event('invoice.paid', 'Finance', ['invoiceId']),
          event('vendor_invoice.submitted', 'Products', ['vendorInvoiceId']),
        ]),
      ],
    });
    await screen.findByText('invoice.paid');
    expect(screen.queryByText('vendor_invoice.submitted')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(await screen.findByText('vendor_invoice.submitted')).toBeInTheDocument();
  });

  it('says so when there are no events', async () => {
    renderWithProviders(<EventCataloguePage />, { mocks: [catalogue([])] });
    expect(await screen.findByText('No events yet.')).toBeInTheDocument();
  });

  it('says why when the catalogue cannot be read, instead of an empty table', async () => {
    renderWithProviders(<EventCataloguePage />, {
      mocks: [{ request: { query: WebhookEventCatalogueDocument }, error: new Error('Forbidden') }],
    });
    await waitFor(() =>
      expect(
        screen.getAllByRole('alert').some((el) => /Forbidden/.test(el.textContent ?? '')),
      ).toBe(true),
    );
    expect(screen.queryByRole('table')).toBeNull();
  });
});
