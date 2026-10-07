import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEscalateSupportTicketMutation } from '@/graphql/generated';
import { TicketEscalateForm } from '@/pages/ticket-desk';
import { ticketEscalateSchema } from '@/pages/ticket-desk/forms/ticket-escalate';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useEscalateSupportTicketMutation: vi.fn(),
}));

const escalate = vi.fn();

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<TicketEscalateForm ticketId="t-1" onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

async function submit(reason: string) {
  if (reason) {
    await userEvent.click(screen.getByRole('textbox', { name: 'Why does it need escalating?' }));
    await userEvent.paste(reason);
  }
  await userEvent.click(screen.getByRole('button', { name: 'Escalate' }));
}

beforeEach(() => {
  escalate.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useEscalateSupportTicketMutation).mockReturnValue(mutationTuple(escalate) as never);
});

describe('ticketEscalateSchema', () => {
  it('trims the reason and bounds its length', () => {
    expect(ticketEscalateSchema.parse({ reason: '  Customer is blocked  ' })).toEqual({
      reason: 'Customer is blocked',
    });
    expect(ticketEscalateSchema.safeParse({ reason: 'x'.repeat(500) }).success).toBe(true);
    expect(
      ticketEscalateSchema.safeParse({ reason: 'x'.repeat(501) }).error?.issues[0].message,
    ).toBe('Keep it under 500 characters');
  });
});

describe('TicketEscalateForm', () => {
  it('needs a reason of at least five characters', async () => {
    const { onDone } = renderForm();
    await submit('Why');
    expect(await screen.findByText('Say why it needs escalating')).toBeInTheDocument();
    expect(escalate).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('escalates with the reason and reports back', async () => {
    const { onDone } = renderForm();
    await submit('Customer is blocked');

    expect(await screen.findByText('Ticket escalated')).toBeInTheDocument();
    expect(escalate).toHaveBeenCalledWith({
      variables: { id: 't-1', reason: 'Customer is blocked' },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("reports the server's reason, staying open", async () => {
    escalate.mockRejectedValueOnce(new Error('Ticket is resolved'));
    const { onDone } = renderForm();
    await submit('Customer is blocked');
    expect(await screen.findByText('Ticket is resolved')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('uses a generic message for a non-Error failure', async () => {
    escalate.mockRejectedValueOnce('offline');
    renderForm();
    await submit('Customer is blocked');
    expect(await screen.findByText('Could not escalate the ticket')).toBeInTheDocument();
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
