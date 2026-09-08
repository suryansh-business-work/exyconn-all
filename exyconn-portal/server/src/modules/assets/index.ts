import { AssetModel } from './asset.model';
import { assetsTypeDefs } from './assets.typeDefs';
import { assignmentsFor, syncAssignment, type AssetHolder } from './assignments';
import { LicenceModel } from './licence.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { UserModel } from '../admin/user.model';
import { withIds } from '../../utils/serialize';
import { unauthenticated } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

interface AssetInput {
  assetTag: string;
  name: string;
  category: string;
  status: string;
  manufacturer?: string;
  modelName?: string;
  serialNumber?: string;
  assignedToId?: string;
  assignedToName?: string;
  location?: string;
  purchaseDate?: Date | null;
  warrantyExpiry?: Date | null;
  purchaseCost?: number;
  notes?: string;
}

/** The IT module owns the asset register; ADMIN passes every guard anyway. */
const itOnly = [ROLES.IT];

export const assetsService = createCrudService<AssetInput>(AssetModel as never, 'Asset');

const crud = createCrudResolvers(assetsService, {
  name: 'Asset',
  roles: itOnly,
  table: {
    searchFields: ['assetTag', 'name', 'serialNumber', 'assignedToName', 'manufacturer'],
    filterFields: ['assetTag', 'name', 'category', 'status', 'assignedToName', 'location'],
    sortFields: ['assetTag', 'name', 'category', 'status', 'assignedToName', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'category'] },
});

/**
 * The picker for who holds an asset. Deliberately narrower than `listUsers`,
 * which is HR's: IT needs a name to put on a row, not an employee record.
 */
const listAssetAssignees = async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
  assertRole(ctx, itOnly);
  const users = await UserModel.find().select('name email').sort({ name: 1 }).lean();
  return withIds(users as Array<{ _id: unknown }>);
};

/** Who is acting, from the request's own token — never from anything the client sent. */
async function actorNameOf(ctx: GraphQLContext): Promise<string> {
  const id = ctx.user?.id;
  if (!id) {
    unauthenticated();
  }
  const user = await UserModel.findById(id).select('name').lean();
  return user?.name ?? ctx.user?.email ?? '';
}

type SavedAsset = { id: string } & AssetHolder;

/**
 * Every write to an asset goes through the same reconciliation, so the history follows from
 * the saved record rather than from whichever screen made the change: a hand-over opens a
 * row, and a reassignment or a status leaving ASSIGNED closes the previous one.
 */
async function recordAssignment(saved: unknown, ctx: GraphQLContext): Promise<unknown> {
  const asset = saved as SavedAsset;
  await syncAssignment(asset.id, asset, await actorNameOf(ctx));
  return saved;
}

const createAsset = async (p: unknown, args: never, ctx: GraphQLContext) =>
  recordAssignment(await crud.Mutation.createAsset(p, args, ctx), ctx);

const updateAsset = async (p: unknown, args: never, ctx: GraphQLContext) =>
  recordAssignment(await crud.Mutation.updateAsset(p, args, ctx), ctx);

/** Every spell this asset has been held for, most recent first. */
const assetAssignments = async (
  _p: unknown,
  { assetId }: { assetId: string },
  ctx: GraphQLContext,
) => {
  assertRole(ctx, itOnly);
  return withIds(await assignmentsFor(assetId));
};

/**
 * The licences one employee holds a seat on. Read off `assigneeIds` — the licence register
 * is the only place a seat is recorded — so an asset page can show what somebody has
 * alongside what they hold.
 */
const licenceSeatsFor = async (
  _p: unknown,
  { employeeId }: { employeeId: string },
  ctx: GraphQLContext,
) => {
  assertRole(ctx, itOnly);
  const licences = await LicenceModel.find({ assigneeIds: employeeId })
    .select('name vendor renewalDate status')
    .sort({ renewalDate: 1 })
    .lean();
  return withIds(licences);
};

export const assetsResolvers = {
  Query: { ...crud.Query, listAssetAssignees, assetAssignments, licenceSeatsFor },
  Mutation: { ...crud.Mutation, createAsset, updateAsset },
};

export { assetsTypeDefs, AssetModel };
export { licencesTypeDefs } from './licences.typeDefs';
export { licencesResolvers, licencesService } from './licences';
