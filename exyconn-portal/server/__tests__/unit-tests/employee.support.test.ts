import { employeeResolvers } from '../../src/modules/employee';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../src/modules/support/support-reply.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const myReplies = employeeResolvers.Query.mySupportReplies as unknown as Resolver;
const addReply = employeeResolvers.Mutation.addMySupportReply as unknown as Resolver;

const asEmployee = (id: string) =>
  ({
    user: { id, email: `${id}@exyconn.com`, roles: [ROLES.EMPLOYEE] },
  }) as unknown as GraphQLContext;

const ME = '65b000000000000000000001';
const SOMEONE_ELSE = '65b000000000000000000002';

const ticketFor = (employeeId: string) =>
  SupportTicketModel.create({
    employeeId,
    subject: 'VPN keeps dropping',
    category: 'IT',
    description: 'Every twenty minutes or so.',
    priority: 'MEDIUM',
  });

const reply = (ticketId: string, body: string, internal: boolean) =>
  SupportReplyModel.create({ ticketId, authorId: 'agent', authorName: 'Asha', body, internal });

describe('mySupportReplies', () => {
  it('shows the employee the public thread but never the internal notes', async () => {
    const ticket = await ticketFor(ME);
    const id = String(ticket._id);
    await reply(id, 'Looking into it.', false);
    await reply(id, 'Probably the old firmware.', true);

    const rows = (await myReplies(null, { ticketId: id }, asEmployee(ME))) as { body: string }[];

    expect(rows.map((r) => r.body)).toEqual(['Looking into it.']);
  });

  it('refuses another employee’s ticket', async () => {
    const ticket = await ticketFor(SOMEONE_ELSE);

    await expect(myReplies(null, { ticketId: String(ticket._id) }, asEmployee(ME))).rejects.toThrow(
      'SupportTicket not found',
    );
  });
});

describe('addMySupportReply', () => {
  it('appends a public reply from the employee to their own ticket', async () => {
    const ticket = await ticketFor(ME);

    const saved = (await addReply(
      null,
      { ticketId: String(ticket._id), body: '  Still happening today.  ' },
      asEmployee(ME),
    )) as { body: string; internal: boolean; authorId: string };

    expect(saved.body).toBe('Still happening today.');
    expect(saved.internal).toBe(false);
    expect(saved.authorId).toBe(ME);
  });

  it('refuses another employee’s ticket', async () => {
    const ticket = await ticketFor(SOMEONE_ELSE);

    await expect(
      addReply(null, { ticketId: String(ticket._id), body: 'Hello?' }, asEmployee(ME)),
    ).rejects.toThrow('SupportTicket not found');
  });

  it('rejects an empty reply', async () => {
    const ticket = await ticketFor(ME);

    await expect(
      addReply(null, { ticketId: String(ticket._id), body: '   ' }, asEmployee(ME)),
    ).rejects.toThrow('A reply cannot be empty.');
  });
});
