import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../../../src/modules/support/support-reply.model';
import { ensureSupportSlaPolicies } from '../../../../src/modules/support/sla.service';
import { reminderSources } from '../../../../src/modules/reminders';
import { logger } from '../../../../src/utils/logger';
import type { ReminderSource } from '../../../../src/modules/reminders';

// Importing the module registers the source under test.
import '../../../../src/modules/support/support.reminders';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const RAISED = new Date('2026-09-01T09:00:00.000Z');
/** An eight-hour window: its last quarter (the "due soon" stretch) is the final two hours. */
const DUE = new Date(RAISED.getTime() + 8 * HOUR);
const minutesFromDue = (minutes: number) => new Date(DUE.getTime() + minutes * MINUTE);

const slaSource = (): ReminderSource => {
  const source = reminderSources().find((candidate) => candidate.key === 'support-sla');
  if (!source) {
    throw new Error('the support-sla reminder source was never registered');
  }
  return source;
};

const ticket = (subject: string) =>
  SupportTicketModel.create({
    employeeId: 'emp-1',
    subject,
    category: 'OTHER',
    description: 'Something is broken.',
    priority: 'HIGH',
    createdAt: RAISED,
    dueAt: DUE,
  });

beforeEach(async () => {
  await ensureSupportSlaPolicies();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('support SLA reminder wording', () => {
  it('says minutes under an hour and hours with minutes over one', async () => {
    await ticket('Export spins');

    const [shortly] = await slaSource().due(minutesFromDue(-45));
    const [later] = await slaSource().due(minutesFromDue(-90));

    expect(shortly.title).toBe('SLA due in 45 min: Export spins');
    expect(later.title).toBe('SLA due in 1h 30m: Export spins');
  });

  it('says how late a breach is in the same shortest form', async () => {
    await ticket('Export spins');

    const [justLate] = await slaSource().due(minutesFromDue(5));
    const [veryLate] = await slaSource().due(minutesFromDue(190));

    expect(justLate.title).toBe('SLA breached by 5 min: Export spins');
    expect(veryLate.title).toBe('SLA breached by 3h 10m: Export spins');
    expect(veryLate.body).toContain('passed 3h 10m ago');
  });
});

describe('support SLA escalation sweep', () => {
  it('escalates a ticket stored before escalation levels existed', async () => {
    const { insertedId } = await SupportTicketModel.collection.insertOne({
      employeeId: 'emp-1',
      subject: 'Legacy ticket',
      category: 'OTHER',
      description: 'Filed long ago.',
      priority: 'MEDIUM',
      status: 'OPEN',
      createdAt: RAISED,
      dueAt: DUE,
      resolvedAt: null,
    });

    await slaSource().due(minutesFromDue(60));

    const after = await SupportTicketModel.findById(insertedId).lean();
    expect(after).toMatchObject({ priority: 'HIGH', escalationLevel: 1 });
  });

  it('logs a ticket whose escalation fails and still escalates and reports the rest', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const create = jest.spyOn(SupportReplyModel, 'create');
    create.mockRejectedValueOnce(new Error('write conflict'));
    await ticket('First late ticket');
    await ticket('Second late ticket');

    const due = await slaSource().due(minutesFromDue(60));

    expect(due.map((reminder) => reminder.title).sort((a, b) => a.localeCompare(b))).toEqual([
      'SLA breached by 1h: First late ticket',
      'SLA breached by 1h: Second late ticket',
    ]);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.stringContaining('Automatic escalation of ticket'),
    );
    expect(await SupportReplyModel.countDocuments()).toBe(1);
  });
});
