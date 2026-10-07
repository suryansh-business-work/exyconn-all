import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddClientContactDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ClientHubAccessDialog } from '../../../../src/pages/clients/hub-access/ClientHubAccessDialog';
import { contact, contactsAnswer, dormant } from './hub-access.fixtures';

const ACME = { id: 'client-1', name: 'Acme' };

const rowOf = async (email: string) =>
  within((await screen.findByText(email)).closest('tr') as HTMLElement);

describe('ClientHubAccessDialog', () => {
  it('stays closed while no client is chosen', () => {
    renderWithProviders(<ClientHubAccessDialog client={null} onClose={vi.fn()} />);
    expect(screen.queryByText(/Client hub access/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Give access' })).toBeNull();
  });

  it('lists who has access, when they last signed in, and the switch that fits each', async () => {
    renderWithProviders(<ClientHubAccessDialog client={ACME} onClose={vi.fn()} />, {
      mocks: [contactsAnswer([contact(), dormant()])],
    });
    expect(screen.getByText('Client hub access — Acme')).toBeInTheDocument();
    expect(screen.getByText(/sign in at the client hub with their email/)).toBeInTheDocument();

    const active = await rowOf('meera@acme.example');
    expect(active.getByText('Meera Iyer')).toBeInTheDocument();
    expect(active.getByText('ACTIVE')).toBeInTheDocument();
    expect(active.queryByText('Never')).toBeNull();
    expect(
      active.getByRole('button', { name: 'switch client hub access off' }),
    ).toBeInTheDocument();
    expect(active.queryByRole('button', { name: 'switch client hub access on' })).toBeNull();

    const off = await rowOf('kiran@acme.example');
    expect(off.getByText('Never')).toBeInTheDocument();
    expect(off.getByText('INACTIVE')).toBeInTheDocument();
    expect(off.getByRole('button', { name: 'switch client hub access on' })).toBeInTheDocument();
    expect(off.queryByRole('button', { name: 'switch client hub access off' })).toBeNull();

    expect(screen.getByRole('button', { name: 'Give access' })).toBeInTheDocument();
    expect(screen.getByText('Projects in the client hub')).toBeInTheDocument();
  });

  it('says when nobody at the client has access yet', async () => {
    renderWithProviders(<ClientHubAccessDialog client={ACME} onClose={vi.fn()} />, {
      mocks: [contactsAnswer([])],
    });
    expect(await screen.findByText('Nobody at this client has access yet.')).toBeInTheDocument();
  });

  it('lists a newly added person once access is given', async () => {
    const user = userEvent.setup();
    const added = contact({ id: 'contact-3', name: 'Ravi Kumar', email: 'ravi@acme.example' });
    renderWithProviders(<ClientHubAccessDialog client={ACME} onClose={vi.fn()} />, {
      mocks: [
        contactsAnswer([contact()]),
        {
          request: {
            query: AddClientContactDocument,
            variables: {
              input: { clientId: 'client-1', name: 'Ravi Kumar', email: 'ravi@acme.example' },
            },
          },
          result: { data: { addClientContact: added } },
        },
        contactsAnswer([contact(), added]),
      ],
    });
    await rowOf('meera@acme.example');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ravi Kumar');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ravi@acme.example');
    await user.click(screen.getByRole('button', { name: 'Give access' }));

    expect((await rowOf('ravi@acme.example')).getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('');
  });

  it('closes from its Close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<ClientHubAccessDialog client={ACME} onClose={onClose} />, {
      mocks: [contactsAnswer([])],
    });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
