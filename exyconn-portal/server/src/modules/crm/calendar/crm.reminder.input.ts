import { isValidObjectId } from 'mongoose';
import { ActivityModel } from '../activity.model';
import { UserModel } from '../../admin/user.model';
import { assertPermission } from '../../../lib/permissions';
import { ROLES } from '../../../constants/roles';
import { badRequest, notFound } from '../../../utils/errors';
import type { GraphQLContext } from '../../../middleware/auth';

type Save = (p: unknown, a: never, c: GraphQLContext) => unknown;

/** The reminder part of an activity's input. Absent fields are left as they are on an update. */
export interface ReminderInput {
  remindAt?: Date | string | null;
  assigneeId?: string | null;
}

/** What an activity stores about its reminder. */
interface ReminderFields {
  remindAt?: Date | null;
  assigneeId?: string;
  assigneeName?: string;
  reminderSentAt?: Date | null;
  reminderAttempts?: number;
}

const crmRoles = [ROLES.CRM];

/** A time as an instant, or null when the input clears it. */
function instantOf(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) {
    badRequest('The reminder time is not a valid date.');
  }
  return at;
}

/** The person a reminder goes to: an active member of this company. */
async function assigneeOf(
  assigneeId: string | null | undefined,
): Promise<{ id: string; name: string }> {
  const id = assigneeId ?? '';
  const user = isValidObjectId(id)
    ? await UserModel.findOne({ _id: id, isActive: true }).select('name').lean()
    : null;
  if (!user) {
    badRequest('Choose who the reminder is for.');
  }
  return { id, name: user.name };
}

/** A reminder must be set for later than now; a time already past would never be sent on time. */
function assertFuture(at: Date, now: Date): void {
  if (at.getTime() <= now.getTime()) {
    badRequest('Pick a reminder time in the future.');
  }
}

/**
 * The stored fields for a new or moved reminder. Moving the time re-arms it — a reminder that
 * already went out and is pushed to Friday goes out again on Friday — and clears the retries.
 */
async function armedFields(input: ReminderInput, at: Date, now: Date): Promise<ReminderFields> {
  assertFuture(at, now);
  const assignee = await assigneeOf(input.assigneeId);
  return {
    remindAt: at,
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    reminderSentAt: null,
    reminderAttempts: 0,
  };
}

/** The fields a create stores for its reminder, if it asked for one. */
export async function reminderForCreate(
  input: ReminderInput,
  now = new Date(),
): Promise<ReminderFields> {
  const at = instantOf(input.remindAt);
  return at ? armedFields(input, at, now) : { remindAt: null, assigneeId: '', assigneeName: '' };
}

/**
 * The fields an update changes for the reminder. A form that does not know about reminders
 * (the activities grid) sends neither field and leaves the reminder untouched; the same time
 * sent again changes nothing, so an edited note never sends a reminder twice.
 */
export async function reminderForUpdate(
  input: ReminderInput,
  before: ReminderFields,
  now = new Date(),
): Promise<ReminderFields> {
  if (input.remindAt === undefined) {
    if (input.assigneeId === undefined || !before.remindAt) {
      return {};
    }
    const assignee = await assigneeOf(input.assigneeId);
    return { assigneeId: assignee.id, assigneeName: assignee.name };
  }
  const at = instantOf(input.remindAt);
  if (!at) {
    return { remindAt: null, reminderSentAt: null, reminderAttempts: 0 };
  }
  if (before.remindAt?.getTime() === at.getTime()) {
    return reminderForUpdate({ assigneeId: input.assigneeId }, before, now);
  }
  // A moved time keeps the stored assignee unless the edit names another.
  return armedFields({ ...input, assigneeId: input.assigneeId ?? before.assigneeId }, at, now);
}

/** Strips the reminder fields from an input, so the rest saves as it always has. */
function split(input: Record<string, unknown>): {
  rest: Record<string, unknown>;
  reminder: ReminderInput;
} {
  const { remindAt, assigneeId, ...rest } = input as Record<string, unknown> & ReminderInput;
  return { rest, reminder: { remindAt, assigneeId } };
}

/** createActivity with its reminder checked and armed. */
export const withReminderOnCreate =
  (save: Save): Save =>
  async (p, args, ctx) => {
    await assertPermission(ctx, 'Activity', crmRoles, 'CREATE');
    const { input } = args as unknown as { input: Record<string, unknown> };
    const { rest, reminder } = split(input);
    const fields = await reminderForCreate(reminder);
    return save(p, { input: { ...rest, ...fields } } as unknown as never, ctx);
  };

/** updateActivity with a moved reminder re-armed and an unchanged one left alone. */
export const withReminderOnUpdate =
  (save: Save): Save =>
  async (p, args, ctx) => {
    await assertPermission(ctx, 'Activity', crmRoles, 'EDIT');
    const { id, input } = args as unknown as { id: string; input: Record<string, unknown> };
    const before = await ActivityModel.findById(id)
      .select('remindAt assigneeId')
      .lean<ReminderFields>();
    if (!before) {
      notFound('Activity');
    }
    const { rest, reminder } = split(input);
    const fields = await reminderForUpdate(reminder, before);
    return save(p, { id, input: { ...rest, ...fields } } as unknown as never, ctx);
  };
