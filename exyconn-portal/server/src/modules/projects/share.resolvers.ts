import { isShareLive, shareService } from './share.service';
import { actorOf } from './board.resolvers';
import { assertRole } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { env } from '../../config/env';
import type { GraphQLContext } from '../../middleware/auth';

const guard = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.PROJECTS]);

type ShareShape = {
  _id: unknown;
  projectId: { toString(): string };
  expiresAt: Date;
  revokedAt?: Date | null;
};

/**
 * A share as the portal lists it. `isLive` is computed rather than stored so a link that has
 * simply run out of time reads as dead without anything having to run to mark it so.
 */
const serializeShare = <T extends ShareShape>(share: T) => ({
  ...withId(share),
  projectId: share.projectId.toString(),
  isLive: isShareLive(share),
});

/** The address the client opens. Built here so the token never has to travel twice. */
const shareUrl = (token: string) => `${env.projectShareBaseUrl}/project/${token}`;

export const shareResolvers = {
  Query: {
    projectShares: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      return (await shareService.shares(projectId)).map((share) => serializeShare(share));
    },
    /** Public: the client following this link has no portal account, by design. */
    sharedProject: (_p: unknown, { token }: { token: string }) =>
      shareService.sharedProject(token),
  },
  Mutation: {
    createProjectShare: async (
      _p: unknown,
      args: { projectId: string; label: string; expiresInDays: number },
      ctx: GraphQLContext,
    ) => {
      guard(ctx);
      const actor = await actorOf(ctx);
      const { share, token } = await shareService.createShare(
        args.projectId,
        args.label,
        args.expiresInDays,
        actor.name,
      );
      return { share: serializeShare(share), url: shareUrl(token) };
    },
    revokeProjectShare: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      guard(ctx);
      return serializeShare(await shareService.revokeShare(id));
    },
  },
};
