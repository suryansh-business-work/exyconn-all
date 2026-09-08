import { supportResolvers } from '../../src/modules/support';
import {
  dueAtFrom,
  isBreached,
  minutesBetween,
  slaState,
} from '../../src/modules/support/support.sla';
import {
  dueAtForPriority,
  ensureSupportSlaPolicies,
  supportSlaSummary,
} from '../../src/modules/support/sla.service';
import { SupportSlaPolicyModel } from '../../src/modules/support/sla-policy.model';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { ROLES } from '../../src/constants/roles';
import { Types } from 'mongoose';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const asSupport = (): GraphQLContext => ({
  user: { id: 'agent-1', roles: [ROLES.SUPPORT], email: 'agent@exyconn.com' },
});

const HOUR = 60 * 60 * 1000;
const raised = new Date('2026-09-01T09:00:00.000Z');
/** An eight-hour window, so a quarter of it is the last two hours. */
const dueAt = new Date(raised.getTime() + 8 * HOUR);
const at = (hoursIn: number) => new Date(raised.getTime() + hoursIn * HOUR);

describe('SLA arithmetic', () => {
  it('puts the deadline a policy window after the ticket was raised', () => {
    expect(dueAtFrom(raised, 480)).toEqual(dueAt);
  });

  it('measures whole minutes and never a negative', () => {
    expect(minutesBetween(raised, at(1))).toBe(60);
    expect(minutesBetween(at(1), raised)).toBe(0);
  });

  it('is on track early in the window', () => {
    expect(slaState({ createdAt: raised, dueAt }, at(1))).toBe('ON_TRACK');
  });

  it('warns once the last quarter of the window is reached', () => {
    expect(slaState({ createdAt: raised, dueAt }, at(5.9))).toBe('ON_TRACK');
    expect(slaState({ createdAt: raised, dueAt }, at(6))).toBe('DUE_SOON');
    expect(slaState({ createdAt: raised, dueAt }, at(7.9))).toBe('DUE_SOON');
  });

  it('breaches once the deadline passes with the ticket still open', () => {
    expect(slaState({ createdAt: raised, dueAt }, at(8.1))).toBe('BREACHED');
    expect(isBreached({ createdAt: raised, dueAt }, at(9))).toBe(true);
  });

  it('is met when it was resolved inside the window, breached when it was resolved late', () => {
    const now = at(20);
    expect(slaState({ createdAt: raised, dueAt, resolvedAt: at(7) }, now)).toBe('MET');
    expect(slaState({ createdAt: raised, dueAt, resolvedAt: dueAt }, now)).toBe('MET');
    expect(slaState({ createdAt: raised, dueAt, resolvedAt: at(9) }, now)).toBe('BREACHED');
  });

  it('promises nothing when no policy covered the priority', () => {
    expect(slaState({ createdAt: raised, dueAt: null }, at(1000))).toBe('ON_TRACK');
  });
});

describe('SLA policies', () => {
  it('seeds the defaults once and leaves an edited policy alone', async () => {
    expect(await ensureSupportSlaPolicies()).toBe(3);
    await SupportSlaPolicyModel.updateOne({ priority: 'HIGH' }, { resolutionMinutes: 120 });

    expect(await ensureSupportSlaPolicies()).toBe(0);
    const high = await SupportSlaPolicyModel.findOne({ priority: 'HIGH' }).lean();
    expect(high?.resolutionMinutes).toBe(120);
    expect(high?.firstResponseMinutes).toBe(60);
  });

  it('gives no deadline when the policy for a priority is switched off', async () => {
    await ensureSupportSlaPolicies();
    await SupportSlaPolicyModel.updateOne({ priority: 'LOW' }, { active: false });

    expect(await dueAtForPriority('LOW', raised)).toBeNull();
    expect(await dueAtForPriority('HIGH', raised)).toEqual(dueAt);
  });
});

const ticketAt = (priority: string, extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    employeeId: String(new Types.ObjectId()),
    subject: 'Laptop will not boot',
    category: 'IT',
    description: 'It stops at the logo.',
    priority,
    ...extra,
  });

describe('SLA on a ticket', () => {
  beforeEach(async () => {
    await ensureSupportSlaPolicies();
  });

  it('recomputes the deadline when the priority changes', async () => {
    const ticket = await ticketAt('LOW', { dueAt: dueAtFrom(raised, 2880) });

    await supportResolvers.Mutation.setSupportTicketTriage(
      null,
      { id: String(ticket._id), category: 'IT', priority: 'HIGH' },
      asSupport(),
    );

    const updated = await SupportTicketModel.findById(ticket._id).lean();
    const created = (updated as unknown as { createdAt: Date }).createdAt;
    expect(updated?.dueAt).toEqual(dueAtFrom(created, 480));
  });

  it('stamps the resolution and clears it when the ticket is reopened', async () => {
    const ticket = await ticketAt('HIGH');

    await supportResolvers.Mutation.setSupportTicketStatus(
      null,
      { id: String(ticket._id), status: 'RESOLVED' },
      asSupport(),
    );
    const resolved = await SupportTicketModel.findById(ticket._id).lean();
    expect(resolved?.resolvedAt).toBeInstanceOf(Date);

    await supportResolvers.Mutation.setSupportTicketStatus(
      null,
      { id: String(ticket._id), status: 'OPEN' },
      asSupport(),
    );
    const reopened = await SupportTicketModel.findById(ticket._id).lean();
    expect(reopened?.resolvedAt).toBeNull();
  });

  it('keeps the original resolution stamp when it is closed after being resolved', async () => {
    const ticket = await ticketAt('HIGH');
    await supportResolvers.Mutation.setSupportTicketStatus(
      null,
      { id: String(ticket._id), status: 'RESOLVED' },
      asSupport(),
    );
    const first = await SupportTicketModel.findById(ticket._id).lean();

    await supportResolvers.Mutation.setSupportTicketStatus(
      null,
      { id: String(ticket._id), status: 'CLOSED' },
      asSupport(),
    );
    const closed = await SupportTicketModel.findById(ticket._id).lean();

    expect(closed?.resolvedAt).toEqual(first?.resolvedAt);
  });

  it('counts the queue against its deadlines, resolved-late included', async () => {
    const past = new Date(Date.now() - HOUR);
    await ticketAt('HIGH', { dueAt: new Date(Date.now() + 10 * HOUR) });
    await ticketAt('HIGH', { dueAt: past });
    await ticketAt('HIGH', { dueAt: past, resolvedAt: new Date() });

    const summary = await supportSlaSummary();

    expect(summary).toEqual({ onTrack: 1, dueSoon: 0, breached: 2 });
  });

  it('reports a ticket past its deadline as breached through the API', async () => {
    const ticket = await ticketAt('HIGH', { dueAt: new Date(Date.now() - HOUR) });

    const row = (await supportResolvers.Query.getSupportTicket(
      null,
      { id: String(ticket._id) },
      asSupport(),
    )) as { createdAt: Date; dueAt: Date | null };

    expect(supportResolvers.SupportTicket.slaState(row)).toBe('BREACHED');
  });
});
