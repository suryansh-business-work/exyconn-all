import { supportResolvers } from '../../src/modules/support';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../src/modules/support/support-reply.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

/** The console is support-team only, so every call needs a context that holds the role. */
const asSupport = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.SUPPORT], email: 'agent@exyconn.com' },
});

/**
 * A support-team member. `seedUser` is the shared helper — the model needs a
 * password hash, so a user cannot be inserted with a plain object.
 */
const supportAgent = () => seedUser('asha@exyconn.com', 'a-strong-password', [ROLES.SUPPORT]);

const ticketFor = (employeeId: string) =>
  SupportTicketModel.create({
    employeeId,
    subject: 'Laptop will not boot',
    category: 'IT',
    description: 'It stops at the logo.',
    priority: 'HIGH',
  });

describe('Support console', () => {
  it('starts a ticket unassigned', async () => {
    const ticket = await ticketFor('emp-1');

    expect(ticket.assigneeId).toBe('');
    expect(ticket.assigneeName).toBe('');
  });

  it('records both the id and the name when a ticket is assigned', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    const updated = await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: String(ticket._id), assigneeId: String(agent._id) },
      asSupport(String(agent._id)),
    );

    expect((updated as { assigneeName: string }).assigneeName).toBe('Asha Rao');
  });

  it('puts a ticket back in the queue when assigned to nobody', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');
    const ctx = asSupport(String(agent._id));
    await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: String(ticket._id), assigneeId: String(agent._id) },
      ctx,
    );

    const cleared = await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: String(ticket._id), assigneeId: '' },
      ctx,
    );

    expect((cleared as { assigneeId: string; assigneeName: string }).assigneeId).toBe('');
    expect((cleared as { assigneeName: string }).assigneeName).toBe('');
  });

  it('stores the author name on a reply so the thread reads later', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket._id), body: '  Looking into it now.  ', internal: false },
      asSupport(String(agent._id)),
    );

    const saved = await SupportReplyModel.findOne({ ticketId: String(ticket._id) }).lean();
    expect(saved?.authorName).toBe('Asha Rao');
    expect(saved?.body).toBe('Looking into it now.');
    expect(saved?.internal).toBe(false);
  });

  it('refuses an empty reply', async () => {
    const ticket = await ticketFor('emp-1');

    await expect(
      supportResolvers.Mutation.addSupportReply(
        null,
        { ticketId: String(ticket._id), body: '   ', internal: false },
        asSupport('agent-1'),
      ),
    ).rejects.toThrow();
  });

  it('returns the thread oldest first', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');
    const ctx = asSupport(String(agent._id));
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket._id), body: 'First', internal: false },
      ctx,
    );
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket._id), body: 'Second', internal: true },
      ctx,
    );

    const thread = (await supportResolvers.Query.listSupportReplies(
      null,
      { ticketId: String(ticket._id) },
      ctx,
    )) as Array<{ body: string }>;

    expect(thread.map((reply) => reply.body)).toEqual(['First', 'Second']);
  });
});
