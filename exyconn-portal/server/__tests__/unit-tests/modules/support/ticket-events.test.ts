import { emitWebhookBestEffort } from '../../../../src/modules/integrations';
import { announceTicketFiled } from '../../../../src/modules/support/ticket-events';

jest.mock('../../../../src/modules/integrations', () => ({
  emitWebhookBestEffort: jest.fn(),
}));

const emit = jest.mocked(emitWebhookBestEffort);

const base = {
  _id: { toString: () => 'ticket-1' },
  reference: 'EXY-ABC234',
  subject: 'Portal will not load',
  category: 'OTHER',
  priority: 'HIGH',
  status: 'OPEN',
  channel: 'EMAIL',
  requesterType: 'CLIENT',
};

describe('announceTicketFiled', () => {
  it('sends every stored field, with the deadline as an ISO stamp', () => {
    const dueAt = new Date('2026-09-01T17:00:00.000Z');

    announceTicketFiled({
      ...base,
      requesterName: 'Dana Reyes',
      requesterEmail: 'dana@acme.test',
      clientId: 'client-9',
      clientName: 'Acme Ltd',
      dueAt,
    });

    expect(emit).toHaveBeenCalledWith('ticket.created', {
      ticketId: 'ticket-1',
      reference: 'EXY-ABC234',
      subject: 'Portal will not load',
      category: 'OTHER',
      priority: 'HIGH',
      status: 'OPEN',
      channel: 'EMAIL',
      requesterType: 'CLIENT',
      requesterName: 'Dana Reyes',
      requesterEmail: 'dana@acme.test',
      clientId: 'client-9',
      clientName: 'Acme Ltd',
      dueAt: '2026-09-01T17:00:00.000Z',
    });
  });

  it('sends empty strings for what an employee ticket with no deadline lacks', () => {
    announceTicketFiled({ ...base, requesterType: 'EMPLOYEE', dueAt: null });

    expect(emit).toHaveBeenCalledWith(
      'ticket.created',
      expect.objectContaining({
        requesterType: 'EMPLOYEE',
        requesterName: '',
        requesterEmail: '',
        clientId: '',
        clientName: '',
        dueAt: '',
      }),
    );
  });
});
