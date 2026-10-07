import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketEscalate } from '@/pages/ticket-desk/TicketEscalate';
import { renderWithProviders } from '../../test-utils';

interface FormStubProps {
  ticketId: string;
  onDone: () => void;
  onCancel: () => void;
}

// The form has its own tests; the stub reports done or cancel the way the real one does.
vi.mock('@/pages/ticket-desk/forms/ticket-escalate', () => ({
  TicketEscalateForm: ({ ticketId, onDone, onCancel }: Readonly<FormStubProps>) => (
    <div>
      <p>{`escalating ${ticketId}`}</p>
      <button type="button" onClick={onDone}>
        form done
      </button>
      <button type="button" onClick={onCancel}>
        form cancel
      </button>
    </div>
  ),
}));

function renderEscalate(level: number, escalatedAt: string | null, closed = false) {
  const onEscalated = vi.fn();
  renderWithProviders(
    <TicketEscalate
      ticketId="t-1"
      escalationLevel={level}
      escalatedAt={escalatedAt}
      closed={closed}
      onEscalated={onEscalated}
    />,
  );
  return onEscalated;
}

const click = async (name: string) => userEvent.click(await screen.findByRole('button', { name }));

describe('TicketEscalate', () => {
  it('says when and how far a ticket was escalated', () => {
    renderEscalate(2, '2026-05-01T09:00:00.000Z');
    expect(screen.getByText(/^Escalated to level 2 on .*2026/)).toBeInTheDocument();
  });

  it('says nothing for a ticket never escalated', () => {
    renderEscalate(0, '2026-05-01T09:00:00.000Z');
    expect(screen.queryByText(/Escalated to level/)).toBeNull();
  });

  it('says nothing when the level is set but the date is missing', () => {
    renderEscalate(1, null);
    expect(screen.queryByText(/Escalated to level/)).toBeNull();
  });

  it('will not escalate a finished ticket', () => {
    renderEscalate(0, null, true);
    expect(screen.getByRole('button', { name: 'Escalate' })).toBeDisabled();
  });

  it('escalates through the form and reports back', async () => {
    const onEscalated = renderEscalate(0, null);
    await click('Escalate');
    expect(screen.getByRole('heading', { name: 'Escalate ticket' })).toBeInTheDocument();
    expect(screen.getByText('escalating t-1')).toBeInTheDocument();

    await click('form done');
    expect(onEscalated).toHaveBeenCalledTimes(1);
    await expect.poll(() => screen.queryByText('escalating t-1')).toBeNull();
  });

  it('closes without escalating on cancel or the close button', async () => {
    const onEscalated = renderEscalate(0, null);
    await click('Escalate');
    await click('form cancel');
    await expect.poll(() => screen.queryByText('escalating t-1')).toBeNull();

    await click('Escalate');
    await click('Close');
    await expect.poll(() => screen.queryByText('escalating t-1')).toBeNull();
    expect(onEscalated).not.toHaveBeenCalled();
  });
});
