import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertRole, assertAuthenticated } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { imageUploader } from '../../utils/imagekit';
import { badRequest } from '../../utils/errors';
import { getBranding, updateBranding, type BrandingInput } from './branding.service';

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
      assertRole(ctx, [ROLES.ADMIN]);
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
  },
};
