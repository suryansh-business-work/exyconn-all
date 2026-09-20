import { hrService } from './hr.service';
import { OnboardingChecklistModel } from '../onboarding/onboarding.model';
import { registerReminderSource, dayKey, daysUntil, dueInWords } from '../reminders';
import { ROLES } from '../../constants/roles';
import type { Reminder } from '../reminders';

/**
 * How far ahead a probation is worth mentioning.
 *
 * A fortnight, because confirming somebody — or not — needs a conversation with their
 * manager first, and the date arriving unnoticed is how a probation quietly turns into
 * employment nobody decided on.
 */
const PROBATION_WINDOW_DAYS = 14;

/** Probations ending soon, which the HR dashboard shows to whoever opens it and nothing else. */
async function probationsEnding(now: Date): Promise<Reminder[]> {
  const rows = await hrService.probationsEnding(PROBATION_WINDOW_DAYS, now);
  return rows.map((employee) => ({
    dedupeKey: `probation:${String(employee._id)}:${dayKey(now)}`,
    kind: 'GENERAL',
    title: `${employee.name} comes off probation ${dueInWords(daysUntil(now, employee.probationEndDate as Date))}`,
    body: 'Confirm them, extend the probation or start a conversation with their manager — the date passing on its own decides it by default.',
    link: `/hr/employees/${String(employee._id)}`,
    roles: [ROLES.HR],
  }));
}

/**
 * Onboarding tasks past their date, told to the person who owns them.
 *
 * Every item carries an owner (HR, IT, the manager or the joiner) and a due date worked out
 * from the start date, and nothing has ever read that date once it passed. A first week is
 * exactly when nobody has time to check a checklist.
 */
async function onboardingOverdue(now: Date): Promise<Reminder[]> {
  const checklists = await OnboardingChecklistModel.find({
    'items.done': false,
    'items.dueOn': { $lte: now },
  })
    .select('employeeId employeeName items')
    .lean();

  return checklists.flatMap((checklist) => {
    const late = checklist.items.filter((item) => !item.done && item.dueOn <= now);
    if (late.length === 0) {
      return [];
    }
    // Grouped by owner, so IT is told about IT's tasks and the joiner is not told about them.
    const owners = [...new Set(late.map((item) => item.owner))];
    return owners.map((owner) => {
      const theirs = late.filter((item) => item.owner === owner);
      const employeeOwns = owner === 'EMPLOYEE';
      return {
        dedupeKey: `onboarding:${String(checklist._id)}:${owner}:${dayKey(now)}`,
        kind: 'ONBOARDING',
        title: `${theirs.length} onboarding task${theirs.length === 1 ? '' : 's'} overdue for ${checklist.employeeName}`,
        body: theirs.map((item) => item.label).join(', '),
        link: employeeOwns ? '/me/onboarding' : '/hr/onboarding',
        // The joiner hears about their own; everybody else's goes to the role that owns it.
        employeeIds: employeeOwns ? [checklist.employeeId] : [],
        roles: ownerRoles(owner),
      };
    });
  });
}

/** Which role answers for a task's owner. The joiner is told by employee id, not by role. */
function ownerRoles(owner: string) {
  if (owner === 'IT') {
    return [ROLES.IT];
  }
  if (owner === 'EMPLOYEE') {
    return [];
  }
  // A manager's tasks go to HR as well as being visible on their own queue: an onboarding
  // task nobody has done is HR's problem in the end.
  return [ROLES.HR];
}

registerReminderSource({
  key: 'hr-people',
  label: 'Probations ending and onboarding tasks overdue',
  async due(now) {
    const [probations, onboarding] = await Promise.all([
      probationsEnding(now),
      onboardingOverdue(now),
    ]);
    return [...probations, ...onboarding];
  },
});
