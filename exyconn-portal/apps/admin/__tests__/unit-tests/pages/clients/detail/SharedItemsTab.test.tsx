import { describe, expect, it, vi } from 'vitest';
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ClientShareOptionsDocument,
  ClientSharedKind,
  UnshareWithClientDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { SharedItemsTab } from '../../../../../src/pages/clients/detail/tabs/SharedItemsTab';
import { CLIENT_ID, sharedAnswer, sharedItem } from './client-detail.fixtures';

const POLICY = sharedItem({
  id: 'share-2',
  kind: ClientSharedKind.Policy,
  title: '',
  status: 'REMOVED',
  fileUrl: '',
  signedAt: null,
  signedBy: null,
});

const options = {
  request: { query: ClientShareOptionsDocument, variables: { kind: ClientSharedKind.Contract } },
  result: { data: { clientShareOptions: [] } },
};

describe('SharedItemsTab', () => {
  it('shows each shared record live, with the counterparty signature on contracts', async () => {
    renderWithProviders(<SharedItemsTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [sharedAnswer([sharedItem(), POLICY])],
    });

    expect(await screen.findByRole('link', { name: 'Master services agreement' })).toHaveAttribute(
      'href',
      'https://files.example/msa.pdf',
    );
    expect(screen.getByText(/Signed by Dana Reyes on/)).toBeInTheDocument();
    expect(screen.getByText('Deleted in Legal')).toBeInTheDocument();
  });

  it('stops sharing after confirming', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    renderWithProviders(<SharedItemsTab clientId={CLIENT_ID} onChanged={onChanged} />, {
      mocks: [
        sharedAnswer([sharedItem()]),
        {
          request: { query: UnshareWithClientDocument, variables: { id: 'share-1' } },
          result: { data: { unshareWithClient: true } },
        },
        sharedAnswer([]),
      ],
    });
    const row = within(
      (await screen.findByText('Master services agreement')).closest('tr') as HTMLElement,
    );
    await user.click(row.getByRole('button', { name: 'stop sharing with the client' }));
    await user.click(await screen.findByRole('button', { name: 'Stop sharing' }));

    expect(await screen.findByText('No longer shared')).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('reports a failed stop and keeps the record, or keeps it when cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SharedItemsTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [
        sharedAnswer([sharedItem()]),
        {
          request: { query: UnshareWithClientDocument, variables: { id: 'share-1' } },
          error: new Error('Shared item not found'),
        },
      ],
    });
    const row = within(
      (await screen.findByText('Master services agreement')).closest('tr') as HTMLElement,
    );
    await user.click(row.getByRole('button', { name: 'stop sharing with the client' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await user.click(
      await row.findByRole('button', { name: 'stop sharing with the client' }, { timeout: 3000 }),
    );
    await user.click(await screen.findByRole('button', { name: 'Stop sharing' }));

    expect(await screen.findByText('Shared item not found')).toBeInTheDocument();
  });

  it('opens the share form and closes it again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SharedItemsTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [sharedAnswer([]), options],
    });
    expect(await screen.findByText(/Nothing shared yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Share from Legal' }));
    expect(
      await screen.findByRole('heading', { name: 'Share with the client' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole('heading', { name: 'Share with the client' }),
    );
    expect(screen.queryByRole('heading', { name: 'Share with the client' })).toBeNull();
  });
});
