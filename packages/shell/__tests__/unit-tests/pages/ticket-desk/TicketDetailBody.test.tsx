import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketDetailBody } from '@/pages/ticket-desk';
import { renderWithProviders } from '../../test-utils';
import { makeTicket } from './ticketFixture';

const { threadMounts } = vi.hoisted(() => ({ threadMounts: vi.fn() }));

interface StubProps {
  ticketId: string;
  topics?: readonly string[];
  closed?: boolean;
  onChanged?: () => void;
  onAssigned?: () => void;
  onEscalated?: () => void;
  onDone?: () => void;
  onCancel?: () => void;
}

// Every piece has its own test; the stubs show what the body handed each one.
vi.mock('@/pages/ticket-desk/TicketThread', async () => {
  const { useEffect } = await import('react');
  return {
    TicketThread: ({ ticketId }: Readonly<StubProps>) => {
      useEffect(() => {
        threadMounts(ticketId);
      }, [ticketId]);
      return <p>thread</p>;
    },
  };
});
vi.mock('@/pages/ticket-desk/TicketTriage', () => ({
  TicketTriage: ({ topics, onChanged }: Readonly<StubProps>) => (
    <button
      type="button"
      onClick={onChanged}
    >{`triage ${topics?.join('/') ?? 'no topics'}`}</button>
  ),
}));
vi.mock('@/pages/ticket-desk/TicketAssignee', () => ({
  TicketAssignee: ({ onAssigned }: Readonly<StubProps>) => (
    <button type="button" onClick={onAssigned}>
      assign
    </button>
  ),
}));
vi.mock('@/pages/ticket-desk/TicketEscalate', () => ({
  TicketEscalate: ({ closed, onEscalated }: Readonly<StubProps>) => (
    <button type="button" onClick={onEscalated}>{`escalate ${closed ? 'closed' : 'open'}`}</button>
  ),
}));
vi.mock('@/pages/ticket-desk/forms/support-reply', () => ({
  SupportReplyForm: ({ onDone, onCancel }: Readonly<StubProps>) => (
    <div>
      <button type="button" onClick={onDone}>
        reply sent
      </button>
      <button type="button" onClick={onCancel}>
        reply cancel
      </button>
    </div>
  ),
}));

function renderBody(patch = {}, topics?: readonly string[]) {
  const onChanged = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <TicketDetailBody
      ticket={makeTicket(patch)}
      onChanged={onChanged}
      onCancel={onCancel}
      topics={topics}
    />,
  );
  return { onChanged, onCancel };
}

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('TicketDetailBody — who raised it', () => {
  it('names the employee', () => {
    renderBody();
    expect(screen.getByText('SUP-101 · Raised by Meera Nair')).toBeInTheDocument();
  });

  it('says "an employee" when the name is unknown', () => {
    renderBody({ employeeName: null });
    expect(screen.getByText('SUP-101 · Raised by an employee')).toBeInTheDocument();
  });

  it('names a customer by company, with their email', () => {
    renderBody({ requesterType: 'CLIENT', clientName: 'Acme', requesterEmail: 'it@acme.test' });
    expect(screen.getByText('SUP-101 · Raised by Acme (it@acme.test)')).toBeInTheDocument();
  });

  it('falls back to the requester name', () => {
    renderBody({ requesterType: 'CLIENT', requesterName: 'Sam' });
    expect(screen.getByText('SUP-101 · Raised by Sam')).toBeInTheDocument();
  });

  it('says "a customer" when nothing is known about them', () => {
    renderBody({ requesterType: 'CLIENT' });
    expect(screen.getByText('SUP-101 · Raised by a customer')).toBeInTheDocument();
  });
});

describe('TicketDetailBody — the pieces', () => {
  it('shows the description and attachments and passes the desk topics on', () => {
    renderBody(
      {
        attachments: [
          { url: 'https://cdn.example.com/a.pdf', name: 'a.pdf', contentType: 'application/pdf' },
        ],
      },
      ['Laptop', 'Network'],
    );
    expect(screen.getByText('It shows a black screen.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /a\.pdf/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'triage Laptop/Network' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'escalate open' })).toBeInTheDocument();
  });

  it.each(['RESOLVED', 'CLOSED'])('treats a %s ticket as finished for escalation', (status) => {
    renderBody({ status });
    expect(screen.getByRole('button', { name: 'escalate closed' })).toBeInTheDocument();
  });

  it('reloads after triage or assignment without refreshing the thread', async () => {
    threadMounts.mockClear();
    const { onChanged } = renderBody();
    await click('triage no topics');
    await click('assign');
    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(threadMounts).toHaveBeenCalledTimes(1);
  });

  it('refreshes the thread and reloads after an escalation or a reply', async () => {
    threadMounts.mockClear();
    const { onChanged, onCancel } = renderBody();
    await click('escalate open');
    await click('reply sent');

    expect(onChanged).toHaveBeenCalledTimes(2);
    expect(threadMounts).toHaveBeenCalledTimes(3);
    expect(threadMounts).toHaveBeenLastCalledWith('t-1');

    await click('reply cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
