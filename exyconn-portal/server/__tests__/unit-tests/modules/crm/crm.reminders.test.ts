import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import { reminderSources } from '../../../../src/modules/reminders/reminders.registry';
import { ROLES } from '../../../../src/constants/roles';
import type { Reminder } from '../../../../src/modules/reminders';

// Importing the module registers the source; this is the one under test.
import '../../../../src/modules/crm/crm.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);

/** The registered `crm-followups` source, asked the same question the sweep asks it. */
function dueNow(): Promise<Reminder[]> {
  const source = reminderSources().find((candidate) => candidate.key === 'crm-followups');
  if (!source) throw new Error('the crm-followups reminder source is not registered');
  return source.due(NOW);
}

const activity = (over: Record<string, unknown>) =>
  ActivityModel.create({ type: 'CALL', subject: 'Call back', owner: 'Asha', ...over });

describe('the CRM follow-up reminder source', () => {
  it('is registered under the label the health screen shows', () => {
    const source = reminderSources().find((candidate) => candidate.key === 'crm-followups');

    expect(source?.label).toBe('CRM follow-ups due');
  });

  it('sends nothing when no follow-up is due', async () => {
    await activity({ dueDate: new Date(NOW.getTime() + DAY) });
    await activity({ dueDate: daysAgo(1), done: true });
    await activity({ dueDate: null });

    await expect(dueNow()).resolves.toEqual([]);
  });

  it('names a single follow-up in the singular, without a related record', async () => {
    await activity({ subject: 'Send the proposal', dueDate: daysAgo(1) });

    await expect(dueNow()).resolves.toEqual([
      {
        dedupeKey: 'crm-followups:2026-09-20',
        kind: 'CRM',
        title: '1 follow-up due',
        body: 'Send the proposal. Open the activities list to clear them or move the dates.',
        link: '/crm/activities',
        roles: [ROLES.CRM],
      },
    ]);
  });

  it('names up to three, oldest first, with the record each is about', async () => {
    await activity({ subject: 'Demo', relatedName: 'Globex', dueDate: daysAgo(1) });
    await activity({ subject: 'Intro call', relatedName: 'Acme', dueDate: daysAgo(3) });
    await activity({ subject: 'Pricing email', dueDate: daysAgo(2) });

    const [reminder] = await dueNow();

    expect(reminder.title).toBe('3 follow-ups due');
    expect(reminder.body).toBe(
      'Intro call (Acme), Pricing email, Demo (Globex). Open the activities list to clear them or move the dates.',
    );
  });

  it('counts the rest once it has named three', async () => {
    for (let index = 1; index <= 4; index += 1) {
      await activity({ subject: `Follow-up ${index}`, dueDate: daysAgo(index) });
    }

    const [reminder] = await dueNow();

    expect(reminder.title).toBe('4 follow-ups due');
    expect(reminder.body).toBe(
      'Follow-up 4, Follow-up 3, Follow-up 2 and 1 more. Open the activities list to clear them or move the dates.',
    );
  });
});
