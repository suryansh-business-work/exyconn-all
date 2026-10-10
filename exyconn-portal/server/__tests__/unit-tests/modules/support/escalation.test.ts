import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { SupportReplyModel } from '../../../../src/modules/support/support-reply.model';
import { SupportSlaPolicyModel } from '../../../../src/modules/support/sla-policy.model';
import { ensureSupportSlaPolicies } from '../../../../src/modules/support/sla.service';
import { dueAtFrom } from '../../../../src/modules/support/support.sla';
import {
  applyEscalation,
  escalateTicket,
  ticketLink,
} from '../../../../src/modules/support/escalation';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const RAISED = new Date('2026-09-01T09:00:00.000Z');

const ticket = (extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    employeeId: 'emp-1',
    subject: 'Payslip missing',
    category: 'PAYROLL',
    description: 'No slip for August.',
    priority: 'LOW',
    createdAt: RAISED,
    ...extra,
  });

const agentCtx = (id: string, email = 'agent@exyconn.com'): GraphQLContext => ({
  user: { id, email, roles: [ROLES.SUPPORT] },
});

describe('ticketLink', () => {
  it('sends IT to its helpdesk and everyone else to the console', () => {
    expect(ticketLink('t1', 'IT')).toBe('/it/helpdesk/t1');
    expect(ticketLink('t1', 'HR')).toBe('/support/tickets/t1');
  });
});

describe('applyEscalation', () => {
  it('raises the level from wherever it stands and recomputes the HIGH deadline', async () => {
    await ensureSupportSlaPolicies();
    const row = await ticket({ escalationLevel: 2 });

    const updated = await applyEscalation(row.toObject(), 'Third complaint', {
      id: 'agent-1',
      name: 'Asha',
    });

    expect(updated).toMatchObject({
      id: row._id.toHexString(),
      priority: 'HIGH',
      escalationLevel: 3,
    });
    expect(updated.dueAt).toEqual(dueAtFrom(RAISED, 480));
    const note = await SupportReplyModel.findOne({ ticketId: row._id.toHexString() }).lean();
    expect(note).toMatchObject({
      authorId: 'agent-1',
      authorName: 'Asha',
      body: 'Escalated to level 3: Third complaint',
      internal: true,
    });
  });

  it('leaves the deadline empty when HIGH has no active policy, and tells nobody unassigned', async () => {
    await ensureSupportSlaPolicies();
    await SupportSlaPolicyModel.updateOne({ priority: 'HIGH' }, { active: false });
    const row = await ticket();

    const updated = await applyEscalation(row.toObject(), 'Urgent', { id: 'a', name: 'A' });

    expect(updated.dueAt).toBeNull();
    expect(await NotificationModel.countDocuments()).toBe(0);
  });

  it('is a 404, with nothing written to the thread, when the ticket has gone', async () => {
    const ghost = { _id: new Types.ObjectId(), subject: 'x', category: 'IT', createdAt: RAISED };

    await expect(applyEscalation(ghost, 'why', { id: 'a', name: 'A' })).rejects.toThrow(
      /SupportTicket/,
    );
    expect(await SupportReplyModel.countDocuments()).toBe(0);
  });
});

describe('escalateTicket', () => {
  it('signs the note with the agent’s display name', async () => {
    const agent = await UserModel.create({
      name: 'Asha Rao',
      email: 'asha@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.SUPPORT],
    });
    const row = await ticket();

    await escalateTicket(
      row._id.toHexString(),
      '  Customer is a VIP  ',
      {},
      agentCtx(agent._id.toHexString()),
    );

    const note = await SupportReplyModel.findOne({ ticketId: row._id.toHexString() }).lean();
    expect(note).toMatchObject({
      authorId: agent._id.toHexString(),
      authorName: 'Asha Rao',
      body: 'Escalated to level 1: Customer is a VIP',
    });
  });

  it('signs with the caller’s email when the account cannot be found', async () => {
    const row = await ticket();

    await escalateTicket(
      row._id.toHexString(),
      'Late',
      {},
      agentCtx(new Types.ObjectId().toHexString()),
    );

    const note = await SupportReplyModel.findOne({ ticketId: row._id.toHexString() }).lean();
    expect(note?.authorName).toBe('agent@exyconn.com');
  });

  it('cannot find a malformed id, an unknown id, or a ticket outside the caller’s desk', async () => {
    const hr = await ticket({ category: 'HR' });
    const ctx = agentCtx(new Types.ObjectId().toHexString());

    await expect(escalateTicket('not-an-id', 'why', {}, ctx)).rejects.toThrow(/SupportTicket/);
    await expect(
      escalateTicket(new Types.ObjectId().toHexString(), 'why', {}, ctx),
    ).rejects.toThrow(/SupportTicket/);
    await expect(
      escalateTicket(hr._id.toHexString(), 'why', { category: 'IT' }, ctx),
    ).rejects.toThrow(/SupportTicket/);
  });

  it('refuses a caller with no signed-in account', async () => {
    const row = await ticket();

    await expect(
      escalateTicket(row._id.toHexString(), 'why', {}, { user: null }),
    ).rejects.toThrow();
    expect(await SupportReplyModel.countDocuments()).toBe(0);
  });
});
