import {
  clearReminderSources,
  registerReminderSource,
  sendReminder,
  sweepReminders,
  dueInWords,
  daysUntil,
  ReminderLogModel,
} from '../../src/modules/reminders';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ContractModel } from '../../src/modules/legal/legal.model';
import { PolicyModel } from '../../src/modules/legal/policy.model';
import { RiskModel } from '../../src/modules/compliance/risk.model';
import { FindingModel } from '../../src/modules/compliance/finding.model';
import { ActivityModel } from '../../src/modules/crm/activity.model';
import { reminderSources } from '../../src/modules/reminders/reminders.registry';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { Reminder } from '../../src/modules/reminders';

// Importing a module registers its sources; these are the ones under test.
import '../../src/modules/legal/legal.reminders';
import '../../src/modules/compliance/compliance.reminders';
import '../../src/modules/crm/crm.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

/** The sources registered by the real modules, kept aside while a test uses its own. */
const registered = [...reminderSources()];

function restoreRealSources() {
  clearReminderSources();
  for (const source of registered) {
    registerReminderSource(source);
  }
}

async function seedComplianceOfficer() {
  const user = await UserModel.create({
    name: 'Meera Iyer',
    email: 'meera@exyconn.com',
    passwordHash: 'x',
    roles: [ROLES.COMPLIANCE],
    isActive: true,
  });
  return String(user._id);
}

async function seedLegalCounsel() {
  const user = await UserModel.create({
    name: 'Dev Shah',
    email: 'dev@exyconn.com',
    passwordHash: 'x',
    roles: [ROLES.LEGAL],
    isActive: true,
  });
  return String(user._id);
}

const onlySource = (key: string, due: (now: Date) => Promise<Reminder[]>) => {
  clearReminderSources();
  registerReminderSource({ key, label: key, due });
};

describe('reminder sweep', () => {
  useTestOrganization();
  afterEach(restoreRealSources);

  it('tells each recipient once, however often it sweeps', async () => {
    const employeeId = await seedLegalCounsel();
    onlySource('test', async () => [
      {
        dedupeKey: 'thing:1:2026-09-20',
        kind: 'GENERAL',
        title: 'A thing is due',
        body: 'Do the thing.',
        link: '/legal',
        employeeIds: [employeeId],
      },
    ]);

    const first = await sweepReminders(NOW);
    const second = await sweepReminders(NOW);

    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    expect(await NotificationModel.countDocuments({ employeeId })).toBe(1);
    expect(await ReminderLogModel.countDocuments()).toBe(1);
  });

  it('reaches everyone holding a role, and nobody deactivated', async () => {
    const active = await seedComplianceOfficer();
    await UserModel.create({
      name: 'Gone Away',
      email: 'gone@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.COMPLIANCE],
      isActive: false,
    });

    const sent = await sendReminder('test', {
      dedupeKey: 'role:1',
      kind: 'COMPLIANCE',
      title: 'Something needs an owner',
      body: 'Have a look.',
      link: '/compliance',
      roles: [ROLES.COMPLIANCE],
    });

    expect(sent).toBe(1);
    expect(await NotificationModel.countDocuments({ employeeId: active })).toBe(1);
  });

  it('keeps sweeping when one source throws', async () => {
    const employeeId = await seedLegalCounsel();
    clearReminderSources();
    registerReminderSource({
      key: 'broken',
      label: 'broken',
      due: () => Promise.reject(new Error('no')),
    });
    registerReminderSource({
      key: 'working',
      label: 'working',
      due: async () => [
        {
          dedupeKey: 'still:1',
          kind: 'GENERAL',
          title: 'Still sent',
          body: '',
          link: '/me',
          employeeIds: [employeeId],
        },
      ],
    });

    const result = await sweepReminders(NOW);

    expect(result).toEqual({ sent: 1, failed: 1 });
  });

  it('refuses to register two sources under one key', () => {
    clearReminderSources();
    const source = { key: 'twice', label: 'twice', due: async () => [] };
    registerReminderSource(source);

    expect(() => registerReminderSource(source)).toThrow('twice');
  });
});

describe('what each module asks to be chased', () => {
  useTestOrganization();

  it('chases a contract inside its last month, and one that has lapsed', async () => {
    await seedLegalCounsel();
    await ContractModel.create({
      title: 'Nimbus MSA',
      party: 'Nimbus Ltd',
      type: 'MSA',
      effectiveDate: new Date(NOW.getTime() - 300 * DAY),
      expiryDate: new Date(NOW.getTime() + 10 * DAY),
      status: 'ACTIVE',
    });
    await ContractModel.create({
      title: 'Old NDA',
      party: 'Former Partner',
      type: 'NDA',
      effectiveDate: new Date(NOW.getTime() - 800 * DAY),
      expiryDate: new Date(NOW.getTime() - 5 * DAY),
      status: 'ACTIVE',
    });
    await ContractModel.create({
      title: 'Next year',
      party: 'Later Ltd',
      type: 'SOW',
      effectiveDate: NOW,
      expiryDate: new Date(NOW.getTime() + 200 * DAY),
      status: 'ACTIVE',
    });

    await sweepReminders(NOW);
    const titles = (await NotificationModel.find().select('title').lean()).map((n) => n.title);

    expect(titles).toContain('Nimbus MSA expires in 10 days');
    expect(titles).toContain('Old NDA has expired');
    expect(titles).not.toContain('Next year expires in 200 days');
  });

  it('chases a policy past its review date', async () => {
    await seedLegalCounsel();
    await PolicyModel.create({
      title: 'Information security policy',
      slug: 'information-security',
      body: '<p>Keep it safe.</p>',
      audience: 'ALL_STAFF',
      category: 'SECURITY',
      status: 'PUBLISHED',
      effectiveDate: new Date(NOW.getTime() - 200 * DAY),
      nextReviewOn: new Date(NOW.getTime() - 3 * DAY),
    });

    await sweepReminders(NOW);

    expect(await NotificationModel.countDocuments({ kind: 'LEGAL' })).toBe(1);
  });

  it('chases an overdue corrective action and the risk behind it', async () => {
    const owner = await seedComplianceOfficer();
    await RiskModel.create({
      reference: 'RISK-0001',
      title: 'Single supplier for the payroll run',
      category: 'OPERATIONAL',
      ownerId: owner,
      ownerName: 'Meera Iyer',
      status: 'TREATING',
      treatment: 'REDUCE',
      identifiedOn: new Date(NOW.getTime() - 60 * DAY),
      likelihood: 3,
      impact: 4,
      residualLikelihood: 2,
      residualImpact: 3,
      reviewDueOn: new Date(NOW.getTime() - DAY),
    });
    await FindingModel.create({
      reference: 'FINDING-0001',
      title: 'Access review not evidenced',
      source: 'INTERNAL_AUDIT',
      type: 'MINOR_NONCONFORMITY',
      category: 'OPERATIONAL',
      raisedOn: new Date(NOW.getTime() - 30 * DAY),
      ownerId: owner,
      ownerName: 'Meera Iyer',
      status: 'ACTION_AGREED',
      dueOn: new Date(NOW.getTime() - 2 * DAY),
    });

    await sweepReminders(NOW);
    const titles = (await NotificationModel.find({ employeeId: owner }).select('title').lean()).map(
      (n) => n.title,
    );

    expect(titles).toContain('RISK-0001 is due for review');
    expect(titles).toContain('FINDING-0001 is past its date');
  });

  it('summarises the CRM follow-up queue instead of itemising it', async () => {
    const user = await UserModel.create({
      name: 'Asha Rao',
      email: 'asha@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.CRM],
      isActive: true,
    });
    for (let index = 0; index < 5; index += 1) {
      await ActivityModel.create({
        type: 'CALL',
        subject: `Call back ${index}`,
        relatedType: 'DEAL',
        relatedName: 'Acme rollout',
        dueDate: new Date(NOW.getTime() - DAY),
        done: false,
        owner: 'Asha Rao',
      });
    }

    await sweepReminders(NOW);
    const notices = await NotificationModel.find({ employeeId: String(user._id) }).lean();

    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe('5 follow-ups due');
    expect(notices[0].body).toContain('and 2 more');
  });
});

describe('how a reminder says when', () => {
  it('counts forwards and backwards from today', () => {
    expect(dueInWords(0)).toBe('today');
    expect(dueInWords(1)).toBe('tomorrow');
    expect(dueInWords(4)).toBe('in 4 days');
    expect(dueInWords(-1)).toBe('yesterday');
    expect(dueInWords(-6)).toBe('6 days ago');
  });

  it('rounds part days up, so this afternoon is still today', () => {
    expect(daysUntil(NOW, new Date(NOW.getTime() + 6 * 60 * 60 * 1000))).toBe(1);
    expect(daysUntil(NOW, new Date(NOW.getTime() - 6 * 60 * 60 * 1000))).toBe(0);
  });
});
