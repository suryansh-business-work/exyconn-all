import type { DetailTicket } from '@/pages/ticket-desk';

/** A ticket as the detail view needs it; override what a test cares about. */
export function makeTicket(patch: Partial<DetailTicket> = {}): DetailTicket {
  return {
    id: 't-1',
    reference: 'SUP-101',
    subject: 'Laptop will not boot',
    description: 'It shows a black screen.',
    status: 'OPEN',
    category: 'IT',
    priority: 'HIGH',
    slaState: 'ON_TRACK',
    topic: 'Laptop',
    escalationLevel: 0,
    escalatedAt: null,
    assigneeId: 'a-1',
    requesterType: 'EMPLOYEE',
    clientName: '',
    requesterName: '',
    requesterEmail: '',
    employeeName: 'Meera Nair',
    attachments: [],
    ...patch,
  };
}
