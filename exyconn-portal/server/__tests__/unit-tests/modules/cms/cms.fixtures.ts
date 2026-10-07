import { Types } from 'mongoose';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { CmsSiteModel } from '../../../../src/modules/cms/models';

/** Shared set-up for the CMS suites (not a suite itself: jest only runs *.test.ts). */

export const EDITOR_EMAIL = 'editor@exyconn.test';

/**
 * A platform administrator (SUPER_ADMIN in no company) — who the CMS guard lets through. No
 * user record backs the id, so "last edited by" falls back to the token's email.
 */
export const editorCtx = (roles: Role[] = [ROLES.SUPER_ADMIN]): GraphQLContext => ({
  user: { id: String(new Types.ObjectId()), roles, email: EDITOR_EMAIL },
});

export function seedSite(slug = 'main', extra: Record<string, unknown> = {}) {
  return CmsSiteModel.create({ name: 'Main', slug, ...extra });
}

/** The placeholder the editor writes for a server-rendered component. */
export const componentHtml = (key: string, inner = '') =>
  `<exy-component data-key="${key}">${inner}</exy-component>`;

/** The placeholder the editor writes for a fragment. */
export const fragmentHtml = (id: string) =>
  `<exy-fragment data-fragment-id="${id}"></exy-fragment>`;

/** A component the catalogue knows (see @exyconn/cms). */
export const KNOWN_COMPONENT = 'chrome.header';
