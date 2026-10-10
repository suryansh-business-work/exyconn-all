import { clientHubService } from '../../../../src/modules/clienthub/clienthub.service';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../../../src/modules/support/support-reply.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import type { ClientHubContact } from '../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../helpers';

const organizationId = useTestOrganization();
const PAGE = { page: 0, pageSize: 10 };

let contact: ClientHubContact;

beforeEach(async () => {
  const client = await ClientModel.create({
    name: 'Dana',
    email: 'dana@acme.test',
    company: 'Acme',
  });
  contact = {
    id: 'contact-1',
    clientId: client._id.toHexString(),
    name: 'Dana Reyes',
    email: 'dana@acme.test',
    organizationId,
  };
});

const ticket = (fields: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    requesterType: 'CLIENT',
    clientId: contact.clientId,
    subject: 'Portal will not load',
    description: 'Every page hangs on the spinner.',
    ...fields,
  });

const reply = (ticketId: unknown, body: string, internal: boolean, createdAt: Date) =>
  SupportReplyModel.create({
    ticketId: String(ticketId),
    authorId: 'agent-1',
    authorName: 'Asha',
    body,
    internal,
    createdAt,
  });

const newTicket = {
  subject: '  Invoice total looks wrong ',
  category: 'OTHER',
  description: 'The September invoice adds tax twice on the support line.',
  priority: 'HIGH',
};

describe('tickets', () => {
  it('lists only the client’s own customer tickets', async () => {
    await ticket();
    await ticket({ clientId: 'someone-else' });
    await ticket({ requesterType: 'EMPLOYEE' });

    const page = await clientHubService.tickets(contact, PAGE);

    expect(page.totalCount).toBe(1);
    expect(page.rows[0]).toMatchObject({ subject: 'Portal will not load', id: expect.any(String) });
  });
});

describe('ticketReplies', () => {
  it('shows the public replies in order and hides internal notes', async () => {
    const own = await ticket();
    await reply(own._id, 'Second', false, new Date('2026-09-02'));
    await reply(own._id, 'Agent-only note', true, new Date('2026-09-01'));
    await reply(own._id, 'First', false, new Date('2026-09-01'));

    const replies = await clientHubService.ticketReplies(contact, own._id.toHexString());

    expect(replies.map((row) => row.body)).toEqual(['First', 'Second']);
  });

  it('treats another client’s ticket as not found', async () => {
    const other = await ticket({ clientId: 'someone-else' });

    await expect(clientHubService.ticketReplies(contact, other._id.toHexString())).rejects.toThrow(
      /Ticket not found/,
    );
  });
});

describe('openTicket', () => {
  it('files a portal ticket for the contact’s client under the contact’s name', async () => {
    const filed = await clientHubService.openTicket(contact, newTicket);

    expect(filed).toMatchObject({
      id: expect.any(String),
      subject: 'Invoice total looks wrong',
      requesterType: 'CLIENT',
      requesterName: 'Dana Reyes',
      requesterEmail: 'dana@acme.test',
      channel: 'PORTAL',
      clientId: contact.clientId,
      clientName: 'Dana',
    });
  });

  it('still files the ticket when the client record has gone', async () => {
    await ClientModel.deleteMany({});

    const filed = await clientHubService.openTicket(contact, newTicket);

    expect(filed).toMatchObject({ clientId: contact.clientId, clientName: '' });
  });

  it('refuses a ticket that fails the customer form rules', async () => {
    await expect(
      clientHubService.openTicket(contact, { ...newTicket, subject: 'Hi' }),
    ).rejects.toThrow(/Subject must be at least/);
    expect(await SupportTicketModel.countDocuments()).toBe(0);
  });
});

describe('replyToTicket', () => {
  it('adds a public reply authored by the contact', async () => {
    const own = await ticket();

    const added = await clientHubService.replyToTicket(
      contact,
      own._id.toHexString(),
      '  Thanks!  ',
    );

    expect(added).toMatchObject({
      id: expect.any(String),
      body: 'Thanks!',
      authorId: 'client:contact-1',
      authorName: 'Dana Reyes',
      internal: false,
    });
  });

  it.each([
    ['an empty reply', '   '],
    ['a reply over 5000 characters', 'x'.repeat(5001)],
  ])('refuses %s', async (_label, body) => {
    const own = await ticket();

    await expect(
      clientHubService.replyToTicket(contact, own._id.toHexString(), body),
    ).rejects.toThrow(/up to 5000 characters/);
    expect(await SupportReplyModel.countDocuments()).toBe(0);
  });

  it('refuses a reply on another client’s ticket', async () => {
    const other = await ticket({ clientId: 'someone-else' });

    await expect(
      clientHubService.replyToTicket(contact, other._id.toHexString(), 'Hello'),
    ).rejects.toThrow(/Ticket not found/);
  });
});

describe('projects', () => {
  it('shows each of the client’s projects as its read-only view', async () => {
    const mine = await ProjectModel.create({
      name: 'Billing revamp',
      status: 'ACTIVE',
      clientId: contact.clientId,
    });
    await ProjectModel.create({ name: 'Not theirs', status: 'ACTIVE', clientId: 'someone-else' });

    const projects = await clientHubService.projects(contact);

    expect(projects).toEqual([
      expect.objectContaining({
        id: mine._id.toHexString(),
        name: 'Billing revamp',
        status: 'ACTIVE',
        milestones: [],
        ticketCounts: [],
      }),
    ]);
  });
});
