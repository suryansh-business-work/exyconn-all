import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportStatus } from '@exyconn/shell/graphql/generated';
import {
  TicketStatusDialog,
  type StatusTicket,
} from '../../../../src/pages/support/TicketStatusDialog';
import { renderWithProviders } from '../../test-utils';
import { click, pickOption } from '../../form.helpers';

interface DialogStubProps {
  open: boolean;
  title: string;
  children: ReactNode;
}

const gql = vi.hoisted(() => ({ setStatus: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetSupportTicketStatusMutation: () => [gql.setStatus, { loading: gql.loading }],
}));
// The drawer's own open/close animation is the shell's; the stand-in keeps the body mounted
// and says whether the drawer would be open, so a closing drawer can be clicked too.
vi.mock('@exyconn/shell/components/data/CrudDialog', () => ({
  CrudDialog: ({ open, title, children }: Readonly<DialogStubProps>) => (
    <section aria-label={title} data-open={String(open)}>
      {children}
    </section>
  ),
}));

const TICKET: StatusTicket = { id: 'ticket-1', subject: 'VPN drops hourly', status: 'OPEN' };

const onClose = vi.fn();
const onSaved = vi.fn();

const renderDialog = (ticket: StatusTicket | null = TICKET) =>
  renderWithProviders(<TicketStatusDialog ticket={ticket} onClose={onClose} onSaved={onSaved} />);

const drawer = () => screen.getByRole('region', { name: 'Update status' });

describe('TicketStatusDialog', () => {
  beforeEach(() => {
    gql.setStatus.mockReset().mockResolvedValue({ data: {} });
    gql.loading = false;
    onClose.mockReset();
    onSaved.mockReset();
  });

  it('stays shut while no ticket is picked', () => {
    renderDialog(null);
    expect(drawer()).toHaveAttribute('data-open', 'false');
  });

  it('opens on the ticket with its subject and current status', () => {
    renderDialog();
    expect(drawer()).toHaveAttribute('data-open', 'true');
    expect(screen.getByText('VPN drops hourly')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('Open');
  });

  it('moves the ticket to the chosen status, then hands back', async () => {
    renderDialog();
    await pickOption(/^Status/, 'Resolved');
    await click('Save');

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(gql.setStatus).toHaveBeenCalledWith({
      variables: { id: 'ticket-1', status: SupportStatus.Resolved },
    });
    expect(await screen.findByText('Ticket status updated')).toBeInTheDocument();
  });

  it('picks up the status of the next ticket it is opened on', () => {
    const { rerender } = renderDialog();
    rerender(
      <TicketStatusDialog
        ticket={{ id: 'ticket-2', subject: 'Printer jam', status: 'IN_PROGRESS' }}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('In Progress');
  });

  it('keeps the drawer open and says why when the server refuses', async () => {
    gql.setStatus.mockRejectedValue(new Error('Ticket is closed'));
    renderDialog();
    await click('Save');

    expect(await screen.findByText('Ticket is closed')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('falls back to a plain failure message when the error says nothing', async () => {
    gql.setStatus.mockRejectedValue('offline');
    renderDialog();
    await click('Save');

    expect(await screen.findByText('Update failed')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('saves nothing once the ticket has gone, even if Save is still on screen', async () => {
    const { rerender } = renderDialog();
    rerender(<TicketStatusDialog ticket={null} onClose={onClose} onSaved={onSaved} />);
    await click('Save');

    expect(gql.setStatus).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows the save in progress and blocks a second one', () => {
    gql.loading = true;
    renderDialog();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('closes on Cancel without saving', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(gql.setStatus).not.toHaveBeenCalled();
  });
});
