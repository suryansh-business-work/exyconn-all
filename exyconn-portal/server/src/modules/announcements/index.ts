import { AnnouncementModel } from './announcement.model';
import { announcementsTypeDefs } from './announcements.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

interface AnnouncementInput {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  publishedAt: Date;
  expiresAt?: Date | null;
}

export const announcementsService = createCrudService<AnnouncementInput>(
  AnnouncementModel as never,
  'Announcement',
);

const crud = createCrudResolvers(announcementsService, {
  name: 'Announcement',
  roles: [ROLES.HR],
  table: {
    searchFields: ['title', 'body'],
    filterFields: ['title', 'category'],
    sortFields: ['title', 'category', 'pinned', 'publishedAt', 'createdAt'],
    defaultSort: { field: 'publishedAt', dir: 'DESC' },
  },
  stats: { countBy: ['category'] },
});

/** Everything live right now, pinned first then newest. */
async function activeAnnouncements(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  assertAuthenticated(ctx);
  const now = new Date();
  const rows = await AnnouncementModel.find({
    publishedAt: { $lte: now },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ pinned: -1, publishedAt: -1 })
    .lean();
  return withIds(rows as { _id: unknown }[]);
}

export const announcementsResolvers = {
  Query: { ...crud.Query, activeAnnouncements },
  Mutation: crud.Mutation,
};
export { announcementsTypeDefs };
