import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ClientShareOptionsDocument,
  ClientSharedKind,
  ShareWithClientDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { ShareWithClientForm } from '../../../../../src/pages/clients/detail/forms/share-with-client';
import { CLIENT_ID, sharedItem } from './client-detail.fixtures';

const options = (kind: ClientSharedKind, title: string) => ({
  request: { query: ClientShareOptionsDocument, variables: { kind } },
  result: {
    data: {
      clientShareOptions: [
        { __typename: 'ClientShareOption', id: `${kind}-1`, title, status: 'ACTIVE' },
      ],
    },
  },
});

describe('ShareWithClientForm', () => {
  it('needs a record to share', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ShareWithClientForm clientId={CLIENT_ID} onDone={vi.fn()} onCancel={vi.fn()} />,
      { mocks: [options(ClientSharedKind.Contract, 'MSA')] },
    );
    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('Pick what to share')).toBeInTheDocument();
  });

  it('shares the picked contract and tells the client', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const input = { kind: ClientSharedKind.Contract, refId: 'CONTRACT-1', note: '', notify: true };
    renderWithProviders(
      <ShareWithClientForm clientId={CLIENT_ID} onDone={onDone} onCancel={vi.fn()} />,
      {
        mocks: [
          options(ClientSharedKind.Contract, 'MSA'),
          {
            request: { query: ShareWithClientDocument, variables: { clientId: CLIENT_ID, input } },
            result: { data: { shareWithClient: sharedItem() } },
          },
        ],
      },
    );
    await user.click(screen.getByRole('combobox', { name: 'Record' }));
    await user.click(await screen.findByRole('option', { name: 'MSA (ACTIVE)' }));
    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByText('Share created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
