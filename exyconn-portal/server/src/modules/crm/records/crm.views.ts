import { ROLES } from '../../../constants/roles';
import { actorNameOf } from '../../../lib/actor';
import { badRequest, forbidden, notFound } from '../../../utils/errors';
import type { GraphQLContext } from '../../../middleware/auth';
import { CrmViewModel } from './crm-view.model';
import type { CrmObject } from './crm.objects';
import { compileFilter, compileSort, type CrmFilterGroup, type CrmSort } from './crm.query';
import { propertyIndex } from './crm.schema';

/**
 * Saved views: a person's own, plus the ones anyone marked shared. Only the owner — or an
 * administrator — changes or deletes one. Filters, sort and columns are checked against the
 * object's properties when saved, so a view never stores a query the list would refuse.
 */
export interface CrmViewInput {
  object: CrmObject;
  name: string;
  shared: boolean;
  search: string;
  groups: CrmFilterGroup[];
  sorts: CrmSort[];
  columns: string[];
}

const MAX_NAME = 60;
const MAX_COLUMNS = 60;
const MAX_VIEWS_PER_PERSON = 50;

type ViewRow = {
  _id: { toHexString(): string };
  ownerId: string;
  ownerName?: string | null;
} & Omit<CrmViewInput, 'groups' | 'sorts'> & { groups?: unknown; sorts?: unknown };

const userIdOf = (ctx: GraphQLContext): string => ctx.user?.id ?? '';

function present(row: ViewRow, userId: string) {
  return {
    id: row._id.toHexString(),
    object: row.object,
    name: row.name,
    shared: row.shared,
    mine: row.ownerId === userId,
    ownerName: row.ownerName ?? '',
    search: row.search ?? '',
    groups: (row.groups ?? []) as CrmFilterGroup[],
    sorts: (row.sorts ?? []) as CrmSort[],
    columns: row.columns ?? [],
  };
}

async function validated(input: CrmViewInput): Promise<CrmViewInput> {
  const name = input.name.trim();
  if (!name || name.length > MAX_NAME) {
    badRequest(`Give the view a name of 1 to ${MAX_NAME} characters`);
  }
  const properties = await propertyIndex(input.object);
  compileFilter(input.object, properties, input);
  compileSort(properties, input.sorts);
  if (input.columns.length > MAX_COLUMNS || input.columns.some((key) => !properties.has(key))) {
    badRequest('The view names a column that does not exist');
  }
  return { ...input, name, search: input.search.trim() };
}

export async function listViews(ctx: GraphQLContext, object: CrmObject) {
  const userId = userIdOf(ctx);
  const rows = await CrmViewModel.find({ object, $or: [{ ownerId: userId }, { shared: true }] })
    .sort({ createdAt: 1 })
    .lean();
  return rows.map((row) => present(row as unknown as ViewRow, userId));
}

export async function createView(ctx: GraphQLContext, input: CrmViewInput) {
  const userId = userIdOf(ctx);
  const count = await CrmViewModel.countDocuments({ object: input.object, ownerId: userId });
  if (count >= MAX_VIEWS_PER_PERSON) {
    badRequest(`You can save up to ${MAX_VIEWS_PER_PERSON} views here; delete one first`);
  }
  const row = await CrmViewModel.create({
    ...(await validated(input)),
    ownerId: userId,
    ownerName: await actorNameOf(ctx),
  });
  return present(row.toObject() as unknown as ViewRow, userId);
}

async function ownedView(ctx: GraphQLContext, id: string) {
  const row = await CrmViewModel.findById(id).lean();
  if (!row) {
    notFound('View');
  }
  const isAdmin = ctx.user?.roles?.includes(ROLES.ADMIN) ?? false;
  if (row.ownerId !== userIdOf(ctx) && !isAdmin) {
    forbidden('Only the person who saved this view can change it');
  }
  return row;
}

export async function updateView(ctx: GraphQLContext, id: string, input: CrmViewInput) {
  const before = await ownedView(ctx, id);
  // The record type a view lists is fixed; only what it shows of it changes.
  const changes = await validated({ ...input, object: before.object });
  const row = await CrmViewModel.findByIdAndUpdate(id, changes, { new: true }).lean();
  if (!row) {
    notFound('View');
  }
  return present(row as unknown as ViewRow, userIdOf(ctx));
}

/** Which record type a view lists, so its permission can be checked before anything else. */
export async function viewObject(id: string): Promise<CrmObject> {
  const row = await CrmViewModel.findById(id).select('object').lean();
  if (!row) {
    notFound('View');
  }
  return row.object;
}

export async function deleteView(ctx: GraphQLContext, id: string): Promise<boolean> {
  await ownedView(ctx, id);
  await CrmViewModel.deleteOne({ _id: id });
  return true;
}
