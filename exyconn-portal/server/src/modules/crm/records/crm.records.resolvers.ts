import { ROLES } from '../../../constants/roles';
import { actorNameOf } from '../../../lib/actor';
import { assertPermission, PERMISSION_MODULES } from '../../../lib/permissions';
import { recordAudit } from '../../audit';
import type { GraphQLContext } from '../../../middleware/auth';
import type { PermissionAction } from '../../permissions/permission.model';
import { importRecords, type ImportInput } from './crm.import';
import { OBJECT_DEFS, type CrmObject } from './crm.objects';
import {
  AUDIT_MODULE,
  createProperties,
  createProperty,
  deleteProperty,
  listProperties,
  updateProperty,
  type CrmPropertiesInput,
  type CrmPropertyInput,
  type CrmPropertyUpdate,
} from './crm.properties';
import { searchRecords, type CrmQueryInput } from './crm.query';
import { objectProperties, OPS_BY_TYPE } from './crm.schema';
import {
  createView,
  deleteView,
  listViews,
  updateView,
  viewObject,
  type CrmViewInput,
} from './crm.views';

const CRM_ROLES = [ROLES.CRM];
PERMISSION_MODULES.add(AUDIT_MODULE);

/** The same permission the record type's own screens check. */
const guard = (ctx: GraphQLContext, object: CrmObject, action: PermissionAction) =>
  assertPermission(ctx, OBJECT_DEFS[object].module, CRM_ROLES, action);

const propertyGuard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, AUDIT_MODULE, CRM_ROLES, action);

const search =
  (object: CrmObject) =>
  async (_p: unknown, { query }: { query: CrmQueryInput }, ctx: GraphQLContext) => {
    await guard(ctx, object, 'VIEW');
    return searchRecords(object, query);
  };

async function importCrmRecords(
  _p: unknown,
  { input }: { input: ImportInput },
  ctx: GraphQLContext,
) {
  if (input.mode !== 'UPDATE') {
    await guard(ctx, input.object, 'CREATE');
  }
  if (input.mode !== 'CREATE') {
    await guard(ctx, input.object, 'EDIT');
  }
  const result = await importRecords(input, await actorNameOf(ctx));
  const { module, plural } = OBJECT_DEFS[input.object];
  const last = input.firstRowNumber + input.rows.length - 1;
  await recordAudit(ctx, {
    action: 'IMPORT',
    module,
    entityLabel: `${plural} rows ${input.firstRowNumber}-${last}`,
    summary: `Imported ${plural} (${input.mode}): ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.issues.length - result.skipped} failed`,
  });
  return result;
}

/** A `.lean()` record saved before custom properties existed has no `custom` at all. */
const customOf = (row: { custom?: unknown }) => row.custom ?? {};

export const crmRecordsResolvers = {
  Lead: { custom: customOf },
  Company: { custom: customOf },
  Contact: { custom: customOf },
  Query: {
    crmObjectSchema: async (
      _p: unknown,
      { object }: { object: CrmObject },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, object, 'VIEW');
      const properties = await objectProperties(object);
      return {
        object,
        dedupeKey: OBJECT_DEFS[object].dedupeKey,
        properties: properties.map((p) => ({ ...p, ops: OPS_BY_TYPE[p.type] })),
      };
    },
    crmProperties: async (_p: unknown, { object }: { object: CrmObject }, ctx: GraphQLContext) => {
      await propertyGuard(ctx, 'VIEW');
      return listProperties(object);
    },
    crmViews: async (_p: unknown, { object }: { object: CrmObject }, ctx: GraphQLContext) => {
      await guard(ctx, object, 'VIEW');
      return listViews(ctx, object);
    },
    searchLeads: search('LEAD'),
    searchCompanies: search('COMPANY'),
    searchContacts: search('CONTACT'),
  },
  Mutation: {
    createCrmProperty: async (
      _p: unknown,
      { input }: { input: CrmPropertyInput },
      ctx: GraphQLContext,
    ) => {
      await propertyGuard(ctx, 'CREATE');
      return createProperty(ctx, input);
    },
    createCrmProperties: async (
      _p: unknown,
      { input }: { input: CrmPropertiesInput },
      ctx: GraphQLContext,
    ) => {
      await propertyGuard(ctx, 'CREATE');
      return createProperties(ctx, input);
    },
    updateCrmProperty: async (
      _p: unknown,
      { id, input }: { id: string; input: CrmPropertyUpdate },
      ctx: GraphQLContext,
    ) => {
      await propertyGuard(ctx, 'EDIT');
      return updateProperty(ctx, id, input);
    },
    deleteCrmProperty: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await propertyGuard(ctx, 'DELETE');
      return deleteProperty(ctx, id);
    },
    createCrmView: async (_p: unknown, { input }: { input: CrmViewInput }, ctx: GraphQLContext) => {
      await guard(ctx, input.object, 'VIEW');
      return createView(ctx, input);
    },
    updateCrmView: async (
      _p: unknown,
      { id, input }: { id: string; input: CrmViewInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, await viewObject(id), 'VIEW');
      return updateView(ctx, id, input);
    },
    deleteCrmView: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, await viewObject(id), 'VIEW');
      return deleteView(ctx, id);
    },
    importCrmRecords,
  },
};
