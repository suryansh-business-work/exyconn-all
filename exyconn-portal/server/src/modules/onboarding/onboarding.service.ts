import { isValidObjectId } from 'mongoose';
import {
  OnboardingChecklistModel,
  OnboardingTemplateModel,
  progressPercent,
  type OnboardingOwner,
} from './onboarding.model';
import { UserModel } from '../admin/user.model';
import { assertMayActFor } from '../admin/reporting';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import { notifyBestEffort } from '../notifications';
import type { GraphQLContext } from '../../middleware/auth';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Roles that may act on ANY item of a checklist; the manager is added by assertMayActFor. */
const CHECKLIST_ROLES = [ROLES.HR, ROLES.IT];

interface TemplateTask {
  key: string;
  label: string;
  owner: OnboardingOwner;
  dueDaysFromJoin: number;
}

interface ChecklistItem {
  key: string;
  label: string;
  owner: OnboardingOwner;
  done: boolean;
  notes: string;
}

/** A template's tasks, dated against one joiner's start date. */
export function itemsFromTemplate(tasks: TemplateTask[], joinDate: Date) {
  return tasks.map((task) => ({
    key: task.key,
    label: task.label,
    owner: task.owner,
    dueOn: new Date(joinDate.getTime() + task.dueDaysFromJoin * MS_PER_DAY),
    done: false,
    doneAt: null,
    doneByName: null,
    notes: '',
  }));
}

/** The signed-in user's display name, for the "ticked by" line. Their email if they have none. */
async function actorName(id: string, email: string): Promise<string> {
  if (!isValidObjectId(id)) return email;
  const user = await UserModel.findById(id).select('name').lean();
  return user?.name ?? email;
}

/**
 * Starts a joiner's onboarding.
 *
 * Refused while the employee still has an unfinished checklist: two open checklists are two
 * answers to "has this person been onboarded", and neither can be trusted.
 */
export async function startOnboarding(employeeId: string, templateId: string, ctx: GraphQLContext) {
  assertRole(ctx, [ROLES.HR]);
  if (!isValidObjectId(employeeId)) notFound('Employee');
  const employee = await UserModel.findById(employeeId).select('name joinDate').lean();
  if (!employee) notFound('Employee');

  const existing = await OnboardingChecklistModel.find({ employeeId }).lean();
  if (existing.some((checklist) => progressPercent(checklist.items) < 100)) {
    badRequest('This employee already has an onboarding checklist that is not finished');
  }

  if (!isValidObjectId(templateId)) notFound('Onboarding template');
  const template = await OnboardingTemplateModel.findById(templateId).lean();
  if (!template) notFound('Onboarding template');

  const joinDate = employee.joinDate ?? new Date();
  const created = await OnboardingChecklistModel.create({
    employeeId,
    employeeName: employee.name,
    templateName: template.name,
    joinDate,
    items: itemsFromTemplate(template.tasks as TemplateTask[], joinDate),
  });

  await notifyBestEffort(employeeId, {
    kind: 'ONBOARDING',
    title: 'Your onboarding checklist is ready',
    body: `${template.name} — everything to do in your first days.`,
    link: '/me/onboarding',
  });
  return created;
}

/**
 * Who may tick one item.
 *
 * The employee may act on the items their onboarding asks THEM to do, and on nothing else —
 * an employee who could tick "laptop issued" would be confirming something only IT can see.
 * Everything else goes through the module's roles or the employee's own manager.
 */
async function assertMayTick(
  ctx: GraphQLContext,
  employeeId: string,
  item: ChecklistItem,
): Promise<void> {
  const user = assertAuthenticated(ctx);
  if (item.owner === 'EMPLOYEE') {
    if (user.id === employeeId) return;
    forbidden('Only the employee may complete their own onboarding tasks');
  }
  await assertMayActFor(ctx, employeeId, CHECKLIST_ROLES);
}

/** Tells HR the moment a joiner's checklist is finished, so nobody has to poll the grid. */
async function notifyHrOfCompletion(employeeName: string): Promise<void> {
  const hr = await UserModel.find({ isActive: true, roles: ROLES.HR }).select('_id').lean();
  await Promise.all(
    hr.map((user) =>
      notifyBestEffort(String(user._id), {
        kind: 'ONBOARDING',
        title: `${employeeName} has finished onboarding`,
        link: '/hr/onboarding',
      }),
    ),
  );
}

/** Ticks one item off (or back on) and records who did it and when. */
export async function setOnboardingItem(
  checklistId: string,
  key: string,
  done: boolean,
  notes: string | null | undefined,
  ctx: GraphQLContext,
) {
  const user = assertAuthenticated(ctx);
  if (!isValidObjectId(checklistId)) notFound('Onboarding checklist');
  const checklist = await OnboardingChecklistModel.findById(checklistId);
  if (!checklist) notFound('Onboarding checklist');

  const item = checklist.items.find((row) => row.key === key);
  if (!item) notFound('Onboarding task');
  await assertMayTick(ctx, checklist.employeeId, item as ChecklistItem);

  const wasComplete = progressPercent(checklist.items) === 100;
  item.done = done;
  item.doneAt = done ? new Date() : null;
  item.doneByName = done ? await actorName(user.id, user.email) : null;
  if (notes !== undefined && notes !== null) {
    item.notes = notes;
  }
  await checklist.save();

  if (!wasComplete && progressPercent(checklist.items) === 100) {
    await notifyHrOfCompletion(checklist.employeeName);
  }
  return checklist;
}
