import { crmEntitiesResolvers } from '../../../../../src/modules/crm';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { AuditLogModel } from '../../../../../src/modules/audit';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { asSales, MINUTE, seedPerson } from './reminder.fixtures';

type Row = {
  id: string;
  remindAt: Date | null;
  assigneeId: string;
  assigneeName: string;
  reminderSentAt: Date | null;
  reminderAttempts: number;
};

const create = (input: Record<string, unknown>, ctx: GraphQLContext = asSales) =>
  crmEntitiesResolvers.Mutation.createActivity(null, { input } as never, ctx) as Promise<Row>;
const update = (id: string, input: Record<string, unknown>) =>
  crmEntitiesResolvers.Mutation.updateActivity(
    null,
    { id, input } as never,
    asSales,
  ) as Promise<Row>;

const base = {
  type: 'TASK',
  subject: 'Send the proposal',
  relatedType: 'CONTACT',
  relatedId: 'contact-1',
  relatedName: 'Ravi',
  done: false,
  owner: 'Asha',
};
const inAnHour = () => new Date(Date.now() + 60 * MINUTE).toISOString();

describe('setting a reminder', () => {
  it('arms it for the assignee, names them and records the creation in the audit log', async () => {
    const asha = await seedPerson('Asha');
    const at = inAnHour();

    const row = await create({ ...base, remindAt: at, assigneeId: asha });

    expect(row.remindAt?.toISOString()).toBe(at);
    expect(row).toMatchObject({ assigneeId: asha, assigneeName: 'Asha', reminderSentAt: null });
    await expect(
      AuditLogModel.countDocuments({ module: 'Activity', action: 'CREATE', entityId: row.id }),
    ).resolves.toBe(1);
  });

  it('refuses a reminder time that has already passed', async () => {
    const asha = await seedPerson('Asha');
    const past = new Date(Date.now() - MINUTE).toISOString();

    await expect(create({ ...base, remindAt: past, assigneeId: asha })).rejects.toThrow(
      'Pick a reminder time in the future.',
    );
    await expect(ActivityModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses an assignee who is missing or deactivated', async () => {
    const gone = await seedPerson('Gone', false);

    await expect(create({ ...base, remindAt: inAnHour(), assigneeId: gone })).rejects.toThrow(
      'Choose who the reminder is for.',
    );
    await expect(create({ ...base, remindAt: inAnHour(), assigneeId: 'nobody' })).rejects.toThrow(
      'Choose who the reminder is for.',
    );
  });

  it('refuses a time that is not a date', async () => {
    const asha = await seedPerson('Asha');

    await expect(create({ ...base, remindAt: 'soon', assigneeId: asha })).rejects.toThrow(
      'The reminder time is not a valid date.',
    );
  });

  it('saves an activity without a reminder exactly as before', async () => {
    const row = await create(base);

    expect(row).toMatchObject({ remindAt: null, assigneeId: '', assigneeName: '' });
  });

  it('is refused to somebody outside the CRM', async () => {
    const asEmployee: GraphQLContext = {
      user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@acme.test' },
    };

    await expect(create(base, asEmployee)).rejects.toThrow();
    await expect(ActivityModel.countDocuments()).resolves.toBe(0);
  });
});

describe('editing a reminder', () => {
  async function sentReminder() {
    const asha = await seedPerson('Asha');
    const row = await create({ ...base, remindAt: inAnHour(), assigneeId: asha });
    await ActivityModel.updateOne(
      { _id: row.id },
      { reminderSentAt: new Date(), reminderAttempts: 2 },
    );
    return { asha, row };
  }

  it('does not send again when the note changes and the time stays', async () => {
    const { row } = await sentReminder();

    const saved = await update(row.id, { ...base, notes: 'Bring pricing', remindAt: row.remindAt });

    expect(saved.reminderSentAt).not.toBeNull();
  });

  it('re-arms a sent reminder whose time is moved later', async () => {
    const { row } = await sentReminder();
    const later = new Date(Date.now() + 3 * 60 * MINUTE).toISOString();

    const saved = await update(row.id, { ...base, remindAt: later });

    expect(saved.remindAt?.toISOString()).toBe(later);
    expect(saved).toMatchObject({ reminderSentAt: null, reminderAttempts: 0 });
  });

  it('refuses moving a reminder into the past', async () => {
    const { row } = await sentReminder();

    await expect(
      update(row.id, { ...base, remindAt: new Date(Date.now() - MINUTE).toISOString() }),
    ).rejects.toThrow('Pick a reminder time in the future.');
  });

  it('removes the reminder when the time is cleared', async () => {
    const { row } = await sentReminder();

    const saved = await update(row.id, { ...base, remindAt: null });

    expect(saved).toMatchObject({ remindAt: null, reminderSentAt: null });
  });

  it('leaves the reminder alone when the form does not know about reminders', async () => {
    const { row, asha } = await sentReminder();

    const saved = await update(row.id, { ...base, subject: 'Renamed' });

    expect(saved).toMatchObject({ assigneeId: asha });
    expect(saved.remindAt?.toISOString()).toBe(row.remindAt?.toISOString());
    expect(saved.reminderSentAt).not.toBeNull();
  });

  it('hands an unchanged reminder to somebody else without sending it again', async () => {
    const { row } = await sentReminder();
    const ravi = await seedPerson('Ravi');

    const saved = await update(row.id, { ...base, remindAt: row.remindAt, assigneeId: ravi });

    expect(saved).toMatchObject({ assigneeId: ravi, assigneeName: 'Ravi' });
    expect(saved.reminderSentAt).not.toBeNull();
  });

  it('reports a missing activity as not found', async () => {
    await expect(update('6512bd43d9caa6e02c990b0a', base)).rejects.toThrow('Activity not found');
  });
});
