import type { FilterQuery } from 'mongoose';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import { registerTable } from '../table-transfer/registry';
import { badRequest, notFound } from '../../utils/errors';
import { UserModel } from '../admin/user.model';
import { MaActionItemModel, type MaActionItemDocument, type MaMeetingDocument } from './models';
import { OPEN_ACTION_STATUSES, type ActionStatus, type Priority } from './ma.enums';
import type { MaActor } from './ma.access';

export const ACTIONS_TABLE: TableConfig = {
  searchFields: ['title', 'description', 'assignedTo', 'meetingTitle'],
  filterFields: [
    'status',
    'priority',
    'assignedUserId',
    'meetingId',
    'needsConfirmation',
    'aiGenerated',
  ],
  sortFields: ['dueDate', 'createdAt', 'priority', 'status', 'title'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};
registerTable('maActionItemsPaged', ACTIONS_TABLE);

/** The most rows one bulk update may touch. */
export const MAX_BULK = 200;
const HISTORY_CAP = 100;

type LeanMeeting = MaMeetingDocument & { _id: unknown };
type ActionDoc = MaActionItemDocument & { _id: unknown };

/** An item as the API returns it, with `overdue` worked out against now. */
export function presentAction(item: ActionDoc, now = new Date()) {
  const open = OPEN_ACTION_STATUSES.has(item.status as ActionStatus);
  return {
    ...item,
    id: String(item._id),
    overdue:
      open && item.dueDate !== null && item.dueDate !== undefined && new Date(item.dueDate) < now,
    comments: item.comments.map((comment) => ({
      ...comment,
      id: String((comment as { _id?: unknown })._id),
    })),
  };
}

export async function actionsPage(
  input: TableQueryInput,
  scope: FilterQuery<ActionDoc>,
  meetingId?: string | null,
) {
  const filter = { ...scope, ...(meetingId ? { meetingId } : {}) };
  const page = await tableQuery(MaActionItemModel, input, ACTIONS_TABLE, filter);
  return {
    totalCount: page.totalCount,
    rows: (page.rows as ActionDoc[]).map((row) => presentAction(row)),
  };
}

export async function actionStats(
  scope: FilterQuery<ActionDoc>,
  meetingId?: string | null,
  now = new Date(),
) {
  const match = { ...scope, ...(meetingId ? { meetingId } : {}) };
  const rows = await MaActionItemModel.aggregate<{ _id: string; count: number }>([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const count = (status: ActionStatus) => rows.find((row) => row._id === status)?.count ?? 0;
  const open = [...OPEN_ACTION_STATUSES];
  const [overdue, needsConfirmation] = await Promise.all([
    MaActionItemModel.countDocuments({ ...match, status: { $in: open }, dueDate: { $lt: now } }),
    MaActionItemModel.countDocuments({ ...match, status: { $in: open }, needsConfirmation: true }),
  ]);
  return {
    total: rows.reduce((sum, row) => sum + row.count, 0),
    pending: count('PENDING'),
    inProgress: count('IN_PROGRESS'),
    blocked: count('BLOCKED'),
    completed: count('COMPLETED'),
    cancelled: count('CANCELLED'),
    overdue,
    needsConfirmation,
  };
}

export interface ActionInput {
  title: string;
  description: string;
  assignedTo?: string | null;
  assignedUserId?: string | null;
  dueDate?: Date | null;
  priority: Priority;
  status: ActionStatus;
}

/** A portal account as an assignee: its verified email comes from the account, never the client. */
async function assignee(input: ActionInput) {
  if (!input.assignedUserId) {
    return {
      assignedTo: input.assignedTo?.trim() || null,
      assignedUserId: null,
      assignedEmail: null,
    };
  }
  const user = await UserModel.findById(input.assignedUserId).select('name email').lean();
  if (!user) {
    badRequest('That person is not in your company.');
  }
  return {
    assignedTo: input.assignedTo?.trim() || user.name,
    assignedUserId: String(user._id),
    assignedEmail: user.email,
  };
}

function checked(input: ActionInput): void {
  if (input.title.trim() === '' || input.title.length > 500 || input.description.length > 5000) {
    badRequest('A title (up to 500 characters) is required; the description is up to 5000.');
  }
}

const show = (value: unknown) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');

export async function createAction(meeting: LeanMeeting, input: ActionInput, actor: MaActor) {
  checked(input);
  const created = await MaActionItemModel.create({
    ...input,
    ...(await assignee(input)),
    title: input.title.trim(),
    meetingId: String(meeting._id),
    meetingTitle: meeting.title,
    meetingCode: meeting.meetingCode,
    viewerIds: meeting.viewerIds,
    completedAt: input.status === 'COMPLETED' ? new Date() : null,
    createdById: actor.id,
    createdByName: actor.name,
  });
  return presentAction(created.toObject() as ActionDoc);
}

/** The fields a person sets, each change recorded in the item's history. */
const TRACKED = [
  'title',
  'description',
  'assignedTo',
  'assignedUserId',
  'dueDate',
  'priority',
  'status',
] as const;

/**
 * Applies a person's edit. Every changed field joins `editedFields`, so a later regenerate
 * never overwrites it; confirming an owner or deadline clears `needsConfirmation`.
 */
export async function updateAction(id: string, input: ActionInput, actor: MaActor) {
  checked(input);
  const item = await MaActionItemModel.findById(id);
  if (!item) {
    notFound('Action item');
  }
  const next = { ...input, ...(await assignee(input)), title: input.title.trim() };
  const at = new Date();
  for (const field of TRACKED) {
    const before = show(item.get(field));
    const after = show(next[field]);
    if (before !== after) {
      item.history.push({ at, byId: actor.id, byName: actor.name, field, from: before, to: after });
      item.editedFields = [...new Set([...item.editedFields, field])];
    }
  }
  if (input.status === 'COMPLETED' && item.status !== 'COMPLETED') {
    item.completedAt = at;
  } else if (input.status !== 'COMPLETED') {
    item.completedAt = null;
  }
  item.set({ ...next, needsConfirmation: false, updatedById: actor.id, updatedByName: actor.name });
  item.history = item.history.slice(-HISTORY_CAP) as typeof item.history;
  await item.save();
  return presentAction(item.toObject() as ActionDoc);
}

/** Complete, reopen, block: a status change on its own. */
export async function setActionStatus(id: string, status: ActionStatus, actor: MaActor) {
  const item = await MaActionItemModel.findById(id).lean<ActionDoc>();
  if (!item) {
    notFound('Action item');
  }
  return updateAction(
    id,
    {
      title: item.title,
      description: item.description,
      assignedTo: item.assignedTo,
      assignedUserId: item.assignedUserId,
      dueDate: item.dueDate,
      priority: item.priority as Priority,
      status,
    },
    actor,
  );
}

export async function addComment(id: string, text: string, actor: MaActor) {
  const body = text.trim();
  if (body === '' || body.length > 2000) {
    badRequest('A comment is 1 to 2000 characters.');
  }
  const item = await MaActionItemModel.findByIdAndUpdate(
    id,
    { $push: { comments: { byId: actor.id, byName: actor.name, text: body } } },
    { new: true },
  ).lean<ActionDoc>();
  if (!item) {
    notFound('Action item');
  }
  return presentAction(item);
}

/** The open, completed and overdue actions of every earlier call in the same series. */
export async function seriesActions(
  meeting: LeanMeeting,
  scope: FilterQuery<ActionDoc>,
  now = new Date(),
) {
  const earlier = await MaActionItemModel.find({
    ...scope,
    meetingCode: meeting.meetingCode,
    meetingId: { $ne: String(meeting._id) },
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<ActionDoc[]>();
  const rows = earlier.map((item) => presentAction(item, now));
  return {
    pendingActions: rows.filter((row) => OPEN_ACTION_STATUSES.has(row.status as ActionStatus)),
    completedActions: rows.filter((row) => row.status === 'COMPLETED').slice(0, 50),
    overdueActions: rows.filter((row) => row.overdue),
  };
}
