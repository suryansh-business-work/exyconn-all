import { AssetModel } from './asset.model';
import { assetsTypeDefs } from './assets.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { UserModel } from '../admin/user.model';
import { withIds } from '../../utils/serialize';
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

export const assetsResolvers = {
  Query: { ...crud.Query, listAssetAssignees },
  Mutation: crud.Mutation,
};

export { assetsTypeDefs, AssetModel };
export { licencesTypeDefs } from './licences.typeDefs';
export { licencesResolvers, licencesService } from './licences';
