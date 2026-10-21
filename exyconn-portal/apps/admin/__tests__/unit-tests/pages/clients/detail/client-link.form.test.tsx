import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CreateClientLinkDocument,
  UpdateClientLinkDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { ClientLinkForm } from '../../../../../src/pages/clients/detail/forms/client-link';
import { CLIENT_ID, link } from './client-detail.fixtures';

const field = (name: string) => screen.getByRole('textbox', { name });

describe('ClientLinkForm', () => {
  it('needs a title and a full web address', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClientLinkForm clientId={CLIENT_ID} initial={null} onDone={vi.fn()} onCancel={vi.fn()} />,
    );
    await user.type(field('Address'), 'staging.acme');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Give the link a title')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a full address starting with http:// or https://'),
    ).toBeInTheDocument();
  });

  it('adds a link and emails the client when asked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const input = {
      title: 'Drive',
      url: 'https://drive.example/acme',
      description: '',
      details: '',
      notify: true,
    };
    renderWithProviders(
      <ClientLinkForm clientId={CLIENT_ID} initial={null} onDone={onDone} onCancel={vi.fn()} />,
      {
        mocks: [
          {
            request: { query: CreateClientLinkDocument, variables: { clientId: CLIENT_ID, input } },
            result: { data: { createClientLink: link({ title: 'Drive' }) } },
          },
        ],
      },
    );
    await user.type(field('Title'), 'Drive');
    await user.type(field('Address'), 'https://drive.example/acme');
    await user.click(screen.getByRole('switch', { name: /Email the client/ }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Link created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('edits a link without offering to announce it again', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const input = {
      title: 'Staging',
      url: 'https://staging.acme.example',
      description: 'Where we show work in progress',
      details: '',
    };
    renderWithProviders(
      <ClientLinkForm clientId={CLIENT_ID} initial={link()} onDone={onDone} onCancel={vi.fn()} />,
      {
        mocks: [
          {
            request: { query: UpdateClientLinkDocument, variables: { id: 'link-1', input } },
            result: { data: { updateClientLink: link({ title: 'Staging' }) } },
          },
        ],
      },
    );
    expect(screen.queryByRole('switch', { name: /Email the client/ })).toBeNull();
    await user.clear(field('Title'));
    await user.type(field('Title'), 'Staging');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Link updated')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
