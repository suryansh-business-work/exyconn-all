import { describe, expect, it, vi } from 'vitest';
import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteClientLinkDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { LinksTab } from '../../../../../src/pages/clients/detail/tabs/LinksTab';
import { CLIENT_ID, link, linksAnswer } from './client-detail.fixtures';

const removed = (outcome: 'ok' | Error) => ({
  request: { query: DeleteClientLinkDocument, variables: { id: 'link-1' } },
  ...(outcome === 'ok' ? { result: { data: { deleteClientLink: true } } } : { error: outcome }),
});

describe('LinksTab', () => {
  it('lists the links with their address opening in a new tab', async () => {
    renderWithProviders(<LinksTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [linksAnswer([link()])],
    });

    const address = await screen.findByRole('link', { name: 'https://staging.acme.example' });
    expect(address).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Staging site')).toBeInTheDocument();
  });

  it('says there are no links yet', async () => {
    renderWithProviders(<LinksTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [linksAnswer([])],
    });

    expect(await screen.findByText(/No links yet/)).toBeInTheDocument();
  });

  it('opens the form to add a link and to edit one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinksTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [linksAnswer([link()])],
    });
    await user.click(screen.getByRole('button', { name: 'Add link' }));
    expect(await screen.findByRole('heading', { name: 'New link' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitForElementToBeRemoved(() => screen.queryByRole('heading', { name: 'New link' }));

    const row = within((await screen.findByText('Staging site')).closest('tr') as HTMLElement);
    await user.click(row.getByRole('button', { name: /edit/i }));
    expect(await screen.findByRole('heading', { name: 'Edit link' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Staging site');
  });

  it('removes a link after confirming and tells the page', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    renderWithProviders(<LinksTab clientId={CLIENT_ID} onChanged={onChanged} />, {
      mocks: [linksAnswer([link()]), removed('ok'), linksAnswer([])],
    });
    const row = within((await screen.findByText('Staging site')).closest('tr') as HTMLElement);
    await user.click(row.getByRole('button', { name: /delete/i }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Link removed')).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('keeps the link and says why when removing fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinksTab clientId={CLIENT_ID} onChanged={vi.fn()} />, {
      mocks: [linksAnswer([link()]), removed(new Error('Link not found'))],
    });
    const row = within((await screen.findByText('Staging site')).closest('tr') as HTMLElement);
    await user.click(row.getByRole('button', { name: /delete/i }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Link not found')).toBeInTheDocument();
  });

  it('does nothing when the removal is cancelled', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    renderWithProviders(<LinksTab clientId={CLIENT_ID} onChanged={onChanged} />, {
      mocks: [linksAnswer([link()])],
    });
    const row = within((await screen.findByText('Staging site')).closest('tr') as HTMLElement);
    await user.click(row.getByRole('button', { name: /delete/i }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(onChanged).not.toHaveBeenCalled();
  });
});
