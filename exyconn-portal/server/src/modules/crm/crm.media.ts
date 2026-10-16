import { assertPermission } from '../../lib/permissions';
import { actorNameOf } from '../../lib/actor';
import { toAttachments, type AttachmentInput } from '../../lib/attachments';
import { ROLES } from '../../constants/roles';
import { imageUploader } from '../../utils/imagekit';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * Files on CRM activities: photos, documents and recordings. The browser uploads one with
 * uploadCrmMedia (base64, checked by its bytes), then saves the activity with the URL.
 */

type Save = (p: unknown, a: never, c: GraphQLContext) => unknown;

/** Stamps who attached each file, from the session, never from the client. */
export const withAttachments =
  (save: Save): Save =>
  async (p, args, ctx) => {
    const { input, ...rest } = args as unknown as {
      input: { attachments?: AttachmentInput[] | null };
    };
    const attachments = toAttachments(input.attachments, await actorNameOf(ctx));
    return save(p, { ...rest, input: { ...input, attachments } } as unknown as never, ctx);
  };

export const crmMediaResolvers = {
  Activity: {
    attachments: (row: { attachments?: unknown[] | null }) => row.attachments ?? [],
    durationSeconds: (row: { durationSeconds?: number | null }) => row.durationSeconds ?? null,
  },
  Mutation: {
    uploadCrmMedia: async (
      _p: unknown,
      { file, fileName }: { file: string; fileName: string },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'Activity', [ROLES.CRM], 'CREATE');
      return imageUploader.uploadCrmMedia(file, fileName);
    },
  },
};
