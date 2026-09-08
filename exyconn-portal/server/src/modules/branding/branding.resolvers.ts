import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { assertPermission } from '../../lib/permissions';
import { withId } from '../../utils/serialize';
import { imageUploader } from '../../utils/imagekit';
import { badRequest } from '../../utils/errors';
import { isPexelsMediaUrl } from '../../utils/pexels';
import { getBranding, updateBranding, type BrandingInput } from './branding.service';

/** Who owns the brand; the matrix restricts them under this module name. */
const brandingRoles = [ROLES.ADMIN];
const BRANDING_MODULE = 'Branding';

/** Guards a single 12 MB image, matching the /graphql body limit. */
const MAX_IMAGE_CHARS = 12 * 1024 * 1024;

export const brandingResolvers = {
  Query: {
    /** Any signed-in user (the portal chrome reads the brand). */
    branding: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return withId(await getBranding());
    },
    /** Unauthenticated — the website, tools and the tracker's login screen need it. */
    publicBranding: async () => withId(await getBranding()),
  },

  Mutation: {
    updateBranding: async (
      _p: unknown,
      { input }: { input: BrandingInput },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, BRANDING_MODULE, brandingRoles, 'EDIT');
      return withId(await updateBranding(input));
    },

    uploadImage: async (
      _p: unknown,
      { file, fileName, folder }: { file: string; fileName: string; folder?: string },
      ctx: GraphQLContext,
    ) => {
      assertAuthenticated(ctx);
      if (file.length > MAX_IMAGE_CHARS) {
        badRequest('Image is too large (max 12 MB).');
      }
      return imageUploader.uploadImage(file, fileName, folder);
    },

    importMediaFromUrl: async (
      _p: unknown,
      { url, fileName, folder }: { url: string; fileName: string; folder?: string },
      ctx: GraphQLContext,
    ) => {
      assertAuthenticated(ctx);
      if (!isPexelsMediaUrl(url)) {
        badRequest('Only Pexels media URLs can be imported.');
      }
      return imageUploader.uploadFromUrl(url, fileName, folder);
    },
  },
};
