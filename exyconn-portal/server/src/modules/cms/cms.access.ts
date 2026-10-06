import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPlatformStaff } from '../../lib/platformAccess';
import { runAsPlatform } from '../../lib/tenant';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';

/** The permission matrix rows the CMS is governed by (registered in lib/permissions.ts). */
export type CmsModule =
  'CmsSite' | 'CmsPage' | 'CmsFragment' | 'CmsAsset' | 'CmsDesignSystem' | 'Newsletter';

/**
 * The website team, in the platform operator's company: the CMS edits Exyconn's own sites,
 * which no customer company may touch. Returns who is acting, for "last edited by".
 */
export async function cmsEditor(
  ctx: GraphQLContext,
  module: CmsModule,
  action: PermissionAction,
): Promise<string> {
  await assertPlatformStaff(ctx, module, [ROLES.WEBSITE], action);
  // Read as the platform: a platform administrator stands in no company, and their user record
  // would otherwise be out of scope for the name lookup.
  return runAsPlatform(() => actorNameOf(ctx));
}
