import { UserModel } from '../../../../src/modules/admin/user.model';
import { OnboardingChecklistModel } from '../../../../src/modules/onboarding/onboarding.model';
import { reminderSources } from '../../../../src/modules/reminders/reminders.registry';
import { ROLES } from '../../../../src/constants/roles';
// Registers the source on import, the way the server does it.
import '../../../../src/modules/hr/hr.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

const due = () => {
  const source = reminderSources().find((entry) => entry.key === 'hr-people');
  if (!source) {
    throw new Error('hr-people is not registered');
  }
  return source.due(NOW);
};

const item = (key: string, owner: string, offsetDays: number, done = false) => ({
  key,
  label: `Task ${key}`,
  owner,
  dueOn: new Date(NOW.getTime() + offsetDays * DAY),
  done,
});

const checklist = (employeeName: string, items: ReturnType<typeof item>[]) =>
  OnboardingChecklistModel.create({
    employeeId: `emp-${employeeName}`,
    employeeName,
    templateName: 'Standard onboarding',
    joinDate: new Date(NOW.getTime() - 10 * DAY),
    items,
  });

describe('the hr-people reminder source', () => {
  it('is registered with a label the sweep can show', () => {
    const source = reminderSources().find((entry) => entry.key === 'hr-people');

    expect(source?.label).toBe('Probations ending and onboarding tasks overdue');
  });

  it('tells HR about a probation ending inside the fortnight, in words', async () => {
    const user = await UserModel.create({
      name: 'Nikhil Roy',
      email: 'nikhil@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.EMPLOYEE],
      isActive: true,
      probationEndDate: new Date(NOW.getTime() + 5 * DAY),
    });
    const id = user._id.toHexString();

    await expect(due()).resolves.toEqual([
      expect.objectContaining({
        dedupeKey: `probation:${id}:2026-09-20`,
        kind: 'GENERAL',
        title: 'Nikhil Roy comes off probation in 5 days',
        link: `/hr/employees/${id}`,
        roles: [ROLES.HR],
      }),
    ]);
  });

  it('groups overdue onboarding tasks by the owner who has to do them', async () => {
    const row = await checklist('Asha', [
      item('laptop', 'IT', -2),
      item('vpn', 'IT', -1),
      item('buddy', 'MANAGER', -3),
      item('policies', 'EMPLOYEE', -1),
      item('review', 'HR', 20),
    ]);
    const id = row._id.toHexString();

    const reminders = await due();

    expect(reminders).toEqual([
      {
        dedupeKey: `onboarding:${id}:IT:2026-09-20`,
        kind: 'ONBOARDING',
        title: '2 onboarding tasks overdue for Asha',
        body: 'Task laptop, Task vpn',
        link: '/hr/onboarding',
        employeeIds: [],
        roles: [ROLES.IT],
      },
      {
        dedupeKey: `onboarding:${id}:MANAGER:2026-09-20`,
        kind: 'ONBOARDING',
        title: '1 onboarding task overdue for Asha',
        body: 'Task buddy',
        link: '/hr/onboarding',
        employeeIds: [],
        roles: [ROLES.HR],
      },
      {
        dedupeKey: `onboarding:${id}:EMPLOYEE:2026-09-20`,
        kind: 'ONBOARDING',
        title: '1 onboarding task overdue for Asha',
        body: 'Task policies',
        link: '/me/onboarding',
        employeeIds: ['emp-Asha'],
        roles: [],
      },
    ]);
  });

  it('says nothing when the overdue task is done and the open one is not due yet', async () => {
    // The query matches the checklist (an undone item, an item past its date), but no single
    // item is both — so nothing is actually late.
    await checklist('Ben', [item('done-late', 'HR', -2, true), item('open-later', 'HR', 5)]);

    await expect(due()).resolves.toEqual([]);
  });
});
