import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareTicketDialog } from '../../../../src/pages/browse/ShareTicketDialog';
import { renderWithProviders } from '../../test-utils';

const form = vi.hoisted(() => ({ props: null as null | Record<string, unknown> }));

vi.mock('../../../../src/pages/browse/forms/ticket-share', () => ({
  TicketShareForm: (props: Readonly<{ onShared: () => void; onCancel: () => void }>) => {
    form.props = props;
    return (
      <div>
        <button type="button" onClick={props.onShared}>
          Shared
        </button>
        <button type="button" onClick={props.onCancel}>
          Cancel share
        </button>
      </div>
    );
  },
}));

const PEOPLE = [{ value: 'emp-1', label: 'Priya' }];

describe('ShareTicketDialog', () => {
  it('titles the panel with the key and hands the form the ticket and people', () => {
    renderWithProviders(
      <ShareTicketDialog
        open
        taskId="task-1"
        ticketKey="EXY-1"
        recipients={PEOPLE}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Share EXY-1' })).toBeInTheDocument();
    expect(screen.getByText(/make the ticket Public and send them its public link/)).toBeInTheDocument();
    expect(form.props).toMatchObject({ taskId: 'task-1', recipients: PEOPLE });
  });

  it('closes once shared or cancelled', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ShareTicketDialog open taskId="task-1" ticketKey="EXY-1" recipients={PEOPLE} onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Shared' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel share' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('mounts no form while closed, so it opens blank every time', () => {
    form.props = null;
    renderWithProviders(
      <ShareTicketDialog
        open={false}
        taskId="task-1"
        ticketKey="EXY-1"
        recipients={PEOPLE}
        onClose={vi.fn()}
      />,
    );

    expect(form.props).toBeNull();
    expect(screen.queryByRole('button', { name: 'Shared' })).not.toBeInTheDocument();
  });
});
