import { isValidObjectId } from 'mongoose';
import { badRequest, notFound } from '../../utils/errors';
import { UserModel } from '../admin/user.model';
import { recordAudit } from '../audit/audit.service';
import type { GraphQLContext } from '../../middleware/auth';
import { LegalAssignmentModel } from './legal-assignment.model';
import { LegalGroupModel, type LegalItemKind } from './legal-group.model';
import { ITEM_MODELS } from './legal-group.service';

/** The most items one call may hand over: a group of contracts, not a whole register. */
export const MAX_ASSIGN_ITEMS = 100;

/** Items that are no longer in use are not handed out. */
const RETIRED_STATUSES = ['ARCHIVED', 'TERMINATED'];

interface ItemRow {
  _id: unknown;
  title: string;
  status: string;
  groupId?: string | null;
  documentUrl?: string | null;
  fileUrl?: string | null;
  content?: string | null;
  body?: string | null;
}

interface AssignmentRow {
  _id: unknown;
  kind: LegalItemKind;
  itemId: string;
  assignedByName?: string | null;
  createdAt: Date;
}

const KINDS: readonly LegalItemKind[] = ['CONTRACT', 'POLICY', 'DOCUMENT'];
const ITEM_FIELDS = 'title status groupId documentUrl fileUrl content body';

function itemModel(kind: LegalItemKind) {
  return ITEM_MODELS[kind] as unknown as {
    find(filter: object): { select(fields: string): { lean(): Promise<ItemRow[]> } };
  };
}

/** Group names by id, read once for a whole list. */
async function groupNames(): Promise<Map<string, string>> {
  const groups = await LegalGroupModel.find().select('name').lean();
  return new Map(groups.map((group) => [String(group._id), group.name]));
}

/** Every item of every kind that can be handed to an employee, with its group's name. */
export async function legalAssignables() {
  const names = await groupNames();
  const lists = await Promise.all(
    KINDS.map(async (kind) => {
      const rows = await itemModel(kind)
        .find({ status: { $nin: RETIRED_STATUSES } })
        .select('title status groupId')
        .lean();
      return rows.map((row) => ({
        id: String(row._id),
        kind,
        title: row.title,
        status: row.status,
        groupId: row.groupId ?? null,
        groupName: row.groupId ? (names.get(row.groupId) ?? null) : null,
      }));
    }),
  );
  return lists.flat();
}

/** One person's assignments, joined to their items. An item since deleted is left out. */
async function assignmentsOf(userId: string) {
  const rows = (await LegalAssignmentModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean()) as AssignmentRow[];
  const names = await groupNames();
  const items = new Map<string, ItemRow>();
  await Promise.all(
    KINDS.map(async (kind) => {
      const ids = rows.filter((row) => row.kind === kind).map((row) => row.itemId);
      if (ids.length === 0) {
        return;
      }
      const found = await itemModel(kind)
        .find({ _id: { $in: ids } })
        .select(ITEM_FIELDS)
        .lean();
      for (const item of found) {
        items.set(`${kind}:${String(item._id)}`, item);
      }
    }),
  );
  return rows.flatMap((row) => {
    const item = items.get(`${row.kind}:${row.itemId}`);
    if (!item) {
      return [];
    }
    return [
      {
        id: String(row._id),
        kind: row.kind,
        itemId: row.itemId,
        title: item.title,
        status: item.status,
        groupName: item.groupId ? (names.get(item.groupId) ?? null) : null,
        fileUrl: item.documentUrl || item.fileUrl || '',
        hasBody: Boolean(item.content || item.body),
        assignedByName: row.assignedByName ?? '',
        assignedAt: row.createdAt,
      },
    ];
  });
}

export const employeeLegalAssignments = (userId: string) => assignmentsOf(userId);

export const myLegalAssignments = (ctx: GraphQLContext) => assignmentsOf(ctx.user?.id ?? '');

/** The text of an item the caller holds. Somebody else's assignment reads as not found. */
export async function myLegalAssignmentBody(ctx: GraphQLContext, id: string): Promise<string> {
  const row = isValidObjectId(id) ? await LegalAssignmentModel.findById(id).lean() : null;
  if (!row || row.userId !== ctx.user?.id) {
    notFound('Assignment');
  }
  const [item] = await itemModel(row.kind).find({ _id: row.itemId }).select(ITEM_FIELDS).lean();
  if (!item) {
    notFound('Assignment');
  }
  return item.content || item.body || '';
}

interface AssignItem {
  kind: LegalItemKind;
  itemId: string;
}

/** Refuses anything that is not a live item of its kind. */
async function assertAssignable(items: readonly AssignItem[]): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  await Promise.all(
    KINDS.map(async (kind) => {
      const ids = items.filter((item) => item.kind === kind).map((item) => item.itemId);
      if (ids.length === 0) {
        return;
      }
      if (!ids.every((itemId) => isValidObjectId(itemId))) {
        badRequest('Choose items from the list');
      }
      const found = await itemModel(kind)
        .find({ _id: { $in: ids }, status: { $nin: RETIRED_STATUSES } })
        .select('title')
        .lean();
      for (const item of found) {
        titles.set(`${kind}:${String(item._id)}`, item.title);
      }
    }),
  );
  if (items.some((item) => !titles.has(`${item.kind}:${item.itemId}`))) {
    badRequest('One of the chosen items no longer exists or is no longer in use');
  }
  return titles;
}

/** The distinct items asked for: the same item twice in one call is handed over once. */
function distinctItems(items: readonly AssignItem[]): AssignItem[] {
  const seen = new Map<string, AssignItem>();
  for (const item of items) {
    seen.set(`${item.kind}:${item.itemId}`, item);
  }
  return [...seen.values()];
}

/**
 * Hands these items to one employee. Items they already hold are left as they are, so
 * assigning a whole group twice changes nothing; every new one is written to the audit log.
 */
export async function assignLegalItems(
  ctx: GraphQLContext,
  userId: string,
  requested: readonly AssignItem[],
) {
  const items = distinctItems(requested);
  if (items.length === 0 || items.length > MAX_ASSIGN_ITEMS) {
    badRequest(`Choose between 1 and ${MAX_ASSIGN_ITEMS} items`);
  }
  const person = isValidObjectId(userId)
    ? await UserModel.findById(userId).select('name email').lean()
    : null;
  if (!person) {
    notFound('User');
  }
  const titles = await assertAssignable(items);
  const held = await LegalAssignmentModel.find({ userId }).select('kind itemId').lean();
  const heldKeys = new Set(held.map((row) => `${row.kind}:${row.itemId}`));
  const fresh = items.filter((item) => !heldKeys.has(`${item.kind}:${item.itemId}`));
  const actor = await UserModel.findById(ctx.user?.id).select('name').lean();
  // Each item is its own row and its own audit entry, so they are written side by side.
  await Promise.all(
    fresh.map(async (item) => {
      const created = await LegalAssignmentModel.create({
        ...item,
        userId,
        assignedById: ctx.user?.id,
        assignedByName: actor?.name ?? ctx.user?.email ?? '',
      });
      const title = titles.get(`${item.kind}:${item.itemId}`) ?? '';
      await recordAudit(ctx, {
        action: 'CREATE',
        module: 'LegalAssignment',
        entityId: created._id,
        entityLabel: title,
        summary: `Assigned ${item.kind.toLowerCase()} "${title}" to ${person.name}`,
      });
    }),
  );
  return assignmentsOf(userId);
}

/** Takes one item back from the person who held it, and logs it. */
export async function unassignLegalItem(ctx: GraphQLContext, id: string): Promise<boolean> {
  const row = isValidObjectId(id) ? await LegalAssignmentModel.findById(id).lean() : null;
  if (!row) {
    notFound('Assignment');
  }
  const [item] = await itemModel(row.kind).find({ _id: row.itemId }).select('title').lean();
  const person = await UserModel.findById(row.userId).select('name').lean();
  await LegalAssignmentModel.deleteOne({ _id: row._id });
  await recordAudit(ctx, {
    action: 'DELETE',
    module: 'LegalAssignment',
    entityId: row._id,
    entityLabel: item?.title ?? row.itemId,
    summary: `Took back ${row.kind.toLowerCase()} "${item?.title ?? row.itemId}" from ${person?.name ?? row.userId}`,
  });
  return true;
}
