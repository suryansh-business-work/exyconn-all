import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../src/modules/support/support-reply.model';
import { ensureSupportSlaPolicies } from '../../src/modules/support/sla.service';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import {
  clearReminderSources,
  registerReminderSource,
  reminderSources,
  sweepReminders,
} from '../../src/modules/reminders';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { ReminderSource } from '../../src/modules/reminders';

// Importing the module registers the source under test.
import '../../src/modules/support/support.reminders';

/** Every source the real modules registered, put back after a test narrows the registry. */
const registered = [...reminderSources()];

function restoreRealSources() {
  clearReminderSources();
  for (const source of registered) {
    registerReminderSource(source);
  }
}

const slaSource = (): ReminderSource => {
  const source = registered.find((candidate) => candidate.key === 'support-sla');
  if (!source) {
    throw new Error('the support-sla reminder source was never registered');
  }
  return source;
};

const HOUR = 60 * 60 * 1000;
const RAISED = new Date('2026-09-01T09:00:00.000Z');
/** HIGH promises 480 minutes, so the window is eight hours and its last quarter is two. */
const at = (hoursIn: number) => new Date(RAISED.getTime() + hoursIn * HOUR);

/**
 * A HIGH-priority ticket raised at `RAISED`, with a deadline `hoursIn` hours after it.
 * `createdAt` is pinned because the "due soon" window is measured from it.
 */
const ticketDueAt = (hoursIn: number, extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    employeeId: new Types.ObjectId().toString(),
    subject: 'Invoices will not export',
    category: 'OTHER',
    description: 'The export button spins forever.',
    priority: 'HIGH',
    createdAt: RAISED,
    dueAt: at(hoursIn),
    ...extra,
  });

async function person(name: string, roles: string[]) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles,
    isActive: true,
  });
  return String(user._id);
}

/** Runs the source on its own, so no other module's reminders reach the log. */
async function sweepOnlySla(now: Date) {
  clearReminderSources();
  registerReminderSource(slaSource());
  return sweepReminders(now);
}

describe('support SLA reminders', () => {
  useTestOrganization();
  afterEach(restoreRealSources);

  beforeEach(async () => {
    await ensureSupportSlaPolicies();
  });

  it('warns whoever holds a ticket in the last quarter of its window', async () => {
    const agent = await person('Sam Desk', [ROLES.SUPPORT]);
    const ticket = await ticketDueAt(8, { assigneeId: agent, assigneeName: 'Sam Desk' });

    const due = await slaSource().due(at(7));

    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({
      dedupeKey: `support-sla-due:${String(ticket._id)}:2026-09-01`,
      kind: 'SUPPORT',
      title: 'SLA due in 1h: Invoices will not export',
      employeeIds: [agent],
      link: `/support/tickets/${String(ticket._id)}`,
    });
  });

  it('tells the support desk instead when nobody holds it', async () => {
    await ticketDueAt(8);

    const [reminder] = await slaSource().due(at(7));

    expect(reminder.roles).toEqual([ROLES.SUPPORT]);
    expect(reminder.employeeIds).toBeUndefined();
  });

  it('points an IT ticket at IT’s own helpdesk', async () => {
    const ticket = await ticketDueAt(8, { category: 'IT' });

    const [reminder] = await slaSource().due(at(7));

    expect(reminder.link).toBe(`/it/helpdesk/${String(ticket._id)}`);
  });

  it('says nothing about a ticket that is still on track, resolved, or has no deadline', async () => {
    await ticketDueAt(8);
    await ticketDueAt(8, { resolvedAt: at(2) });
    await SupportTicketModel.create({
      employeeId: new Types.ObjectId().toString(),
      subject: 'No promise was made',
      category: 'OTHER',
      description: 'Nothing covers this priority.',
      createdAt: RAISED,
      dueAt: null,
    });

    expect(await slaSource().due(at(1))).toEqual([]);
  });

  it('escalates a breached ticket once, with a note signed by the monitor', async () => {
    const agent = await person('Sam Desk', [ROLES.SUPPORT]);
    const ticket = await ticketDueAt(8, {
      priority: 'LOW',
      assigneeId: agent,
      assigneeName: 'Sam Desk',
    });

    const due = await slaSource().due(at(10));

    const after = await SupportTicketModel.findById(ticket._id).lean();
    expect(after).toMatchObject({ priority: 'HIGH', escalationLevel: 1 });
    expect(after?.escalatedAt).toBeInstanceOf(Date);
    const note = await SupportReplyModel.findOne({ ticketId: String(ticket._id) }).lean();
    expect(note).toMatchObject({
      internal: true,
      authorId: 'sla-monitor',
      authorName: 'SLA monitor',
      body: expect.stringContaining('Escalated to level 1:'),
    });
    expect(due[0].title).toBe('SLA breached by 2h: Invoices will not export');
    expect(
      await NotificationModel.countDocuments({ employeeId: agent, kind: 'SUPPORT' }),
    ).toBeGreaterThan(0);
  });

  it('never escalates the same ticket twice, however often it sweeps', async () => {
    const ticket = await ticketDueAt(8);

    await slaSource().due(at(10));
    await slaSource().due(at(34));

    const after = await SupportTicketModel.findById(ticket._id).lean();
    expect(after?.escalationLevel).toBe(1);
    expect(await SupportReplyModel.countDocuments({ ticketId: String(ticket._id) })).toBe(1);
  });

  it('leaves a ticket a person already escalated alone', async () => {
    const ticket = await ticketDueAt(8, { escalationLevel: 2 });

    await slaSource().due(at(10));

    const after = await SupportTicketModel.findById(ticket._id).lean();
    expect(after?.escalationLevel).toBe(2);
    expect(await SupportReplyModel.countDocuments({ ticketId: String(ticket._id) })).toBe(0);
  });

  it('notifies once a day, not once an hour', async () => {
    const agent = await person('Sam Desk', [ROLES.SUPPORT]);
    await ticketDueAt(8, { assigneeId: agent, assigneeName: 'Sam Desk' });

    const first = await sweepOnlySla(at(7));
    const second = await sweepOnlySla(at(7.5));

    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    const warnings = await NotificationModel.find({ employeeId: agent, kind: 'SUPPORT' }).lean();
    expect(warnings.filter((row) => row.title.startsWith('SLA due in'))).toHaveLength(1);
  });
});
