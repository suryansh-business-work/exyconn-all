import { ROLES } from '../../../constants/roles';
import { assertPlatformStaff } from '../../../lib/platformAccess';
import type { GraphQLContext } from '../../../middleware/auth';
import type { PermissionAction } from '../../permissions/permission.model';
import { recordAudit } from '../../audit';
import { transferService } from './transfer.service';

type Scope = { section?: string | null };

/** Export reads every secret and import writes them: both are TechConfig EDIT, behind the vault. */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);

const where = (section?: string | null) => (section ? `the ${section} section` : 'every section');

export const techTransferResolvers = {
  Query: {
    techConfigItems: async (_p: unknown, { section }: { section: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return transferService.itemsOf(section);
    },
    exportTechConfigs: async (
      _p: unknown,
      { section, ids }: Scope & { ids?: string[] | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EXPORT');
      await guard(ctx, 'EDIT');
      const file = await transferService.exportItems(section ?? null, ids?.length ? ids : null);
      await recordAudit(ctx, {
        action: 'ACCESS',
        module: 'TechConfig',
        entityLabel: 'Environment Variables',
        summary: `Exported ${file.items.length} config(s) from ${where(section)} as JSON, secrets included`,
      });
      return JSON.stringify(file, null, 2);
    },
  },
  Mutation: {
    importTechConfigs: async (
      _p: unknown,
      { section, json }: Scope & { json: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      const result = await transferService.importFile(section ?? null, json);
      await recordAudit(ctx, {
        action: 'IMPORT',
        module: 'TechConfig',
        entityLabel: 'Environment Variables',
        summary: `Imported JSON into ${where(section)}: ${result.created} added, ${result.updated} updated, ${result.skipped} skipped`,
      });
      return result;
    },
  },
};
