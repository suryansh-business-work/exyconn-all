import { randomUUID } from 'node:crypto';
import { employeeResolvers } from '../../../../src/modules/employee';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../../../src/modules/support/support-reply.model';
import { SupportSlaPolicyModel } from '../../../../src/modules/support/sla-policy.model';
import { announceTicketFiled } from '../../../../src/modules/support/ticket-events';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { freezeClock, seedUser } from '../../../helpers';

jest.mock('../../../../src/modules/support/ticket-events', () => ({
  announceTicketFiled: jest.fn(),
}));

type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = employeeResolvers.Mutation as unknown as Record<string, Resolve>;
const announce = jest.mocked(announceTicketFiled);

const as = (id: string, email = `${id}@example.com`): GraphQLContext => ({
  user: { id, email, roles: [ROLES.EMPLOYEE] },
});

const input = (priority: string) => ({
  subject: '  Laptop will not boot ',
  category: 'IT',
  description: 'Black screen since this morning.',
  priority,
  attachments: [
    { url: ' https://files.example.com/photo.jpg ', name: ' photo.jpg ', contentType: null },
  ],
});

afterEach(() => jest.useRealTimers());

describe('createSupportTicket', () => {
  it('files an open employee ticket with a reference, a deadline and its attachments', async () => {
    freezeClock('2026-09-10T09:00:00.000Z');
    await SupportSlaPolicyModel.create({
      priority: 'HIGH',
      firstResponseMinutes: 60,
      resolutionMinutes: 480,
    });
    const me = '65b000000000000000000031';

    const ticket = (await M.createSupportTicket(null, { input: input('HIGH') }, as(me))) as Record<
      string,
      unknown
    > & { attachments: Array<Record<string, unknown>>; dueAt: Date };

    expect(ticket).toMatchObject({
      subject: 'Laptop will not boot',
      employeeId: me,
      requesterType: 'EMPLOYEE',
      status: 'OPEN',
      priority: 'HIGH',
    });
    expect(ticket.reference).toMatch(/^EXY-[A-Z2-9]{6}$/);
    expect(ticket.dueAt.toISOString()).toBe('2026-09-10T17:00:00.000Z');
    expect(ticket.attachments[0]).toMatchObject({
      url: 'https://files.example.com/photo.jpg',
      name: 'photo.jpg',
      contentType: '',
      uploadedBy: `${me}@example.com`,
    });
    expect(ticket.id).toBe(String(ticket._id));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(String(announce.mock.calls[0][0]._id)).toBe(ticket.id);
  });

  it('files a ticket with no deadline when its priority has no active policy', async () => {
    const ticket = (await M.createSupportTicket(
      null,
      { input: { ...input('LOW'), attachments: null } },
      as('65b000000000000000000032'),
    )) as { dueAt: Date | null; attachments: unknown[] };

    expect(ticket.dueAt).toBeNull();
    expect(ticket.attachments).toEqual([]);
    expect(await SupportTicketModel.countDocuments()).toBe(1);
  });

  it('refuses a caller who is not signed in', async () => {
    await expect(
      M.createSupportTicket(null, { input: input('LOW') }, { user: null }),
    ).rejects.toThrow('Authentication required');
    expect(announce).not.toHaveBeenCalled();
  });
});

describe('addMySupportReply authorship', () => {
  const ticketFor = (employeeId: string) =>
    SupportTicketModel.create({
      employeeId,
      subject: 'VPN',
      category: 'IT',
      description: 'Drops',
      priority: 'MEDIUM',
    });

  it('signs the reply with the account’s name and files its attachments under it', async () => {
    const user = await seedUser('priya@example.com', `pw-${randomUUID()}`, [ROLES.EMPLOYEE]);
    const id = String(user._id);
    const ticket = await ticketFor(id);

    const reply = (await M.addMySupportReply(
      null,
      {
        ticketId: String(ticket._id),
        body: 'Screenshot attached',
        attachments: [
          { url: 'https://files.example.com/s.png', name: 's.png', contentType: 'image/png' },
        ],
      },
      as(id, 'priya@example.com'),
    )) as { authorName: string; attachments: Array<{ uploadedBy: string; contentType: string }> };

    expect(reply.authorName).toBe('priya');
    expect(reply.attachments[0]).toMatchObject({ uploadedBy: 'priya', contentType: 'image/png' });
  });

  it('falls back to the email when the account cannot be read', async () => {
    const ticket = await ticketFor('legacy-employee');

    const reply = (await M.addMySupportReply(
      null,
      { ticketId: String(ticket._id), body: 'Any news?' },
      as('legacy-employee', 'legacy@example.com'),
    )) as { authorName: string; attachments: unknown[] };

    expect(reply.authorName).toBe('legacy@example.com');
    expect(reply.attachments).toEqual([]);
    expect(await SupportReplyModel.countDocuments({ ticketId: String(ticket._id) })).toBe(1);
  });

  it('falls back to the email when the account no longer exists', async () => {
    const gone = '65b000000000000000000039';
    const ticket = await ticketFor(gone);

    const reply = (await M.addMySupportReply(
      null,
      { ticketId: String(ticket._id), body: 'Hello' },
      as(gone, 'gone@example.com'),
    )) as { authorName: string };

    expect(reply.authorName).toBe('gone@example.com');
  });
});
