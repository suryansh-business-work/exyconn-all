import { ANNOUNCEMENT_IT_CATEGORIES, AnnouncementModel } from './announcement.model';
import { announcementsTypeDefs } from './announcements.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { withIds } from '../../utils/serialize';
import { ROLES } from '../../constants/roles';
import { broadcast } from '../notifications/notifications.service';
import { isValidObjectId } from 'mongoose';
import { UserModel } from '../admin/user.model';
import { badRequest, forbidden } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableConfig } from '../../utils/tableQuery';

interface AnnouncementInput {
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  publishedAt: Date;
  expiresAt?: Date | null;
  audience: 'ALL' | 'DEPARTMENT' | 'EMPLOYEES';
  department?: string | null;
  employeeIds?: string[] | null;
}

/** A DEPARTMENT announcement without a department (or EMPLOYEES without ids) would reach nobody. */
function assertAudience(input: AnnouncementInput) {
  if (input.audience === 'DEPARTMENT' && !input.department)
    badRequest('department is required for a DEPARTMENT audience');
  if (input.audience === 'EMPLOYEES' && !input.employeeIds?.length)
    badRequest('employeeIds is required for an EMPLOYEES audience');
}

const IT_CATEGORIES: ReadonlySet<string> = new Set(ANNOUNCEMENT_IT_CATEGORIES);

/**
 * HR (and ADMIN) publish anything; IT publishes only its own kinds — maintenance, outages and
 * security alerts — and may only touch announcements of those kinds.
 */
function assertMayPublish(ctx: GraphQLContext, category: string | null | undefined) {
  const roles = assertAuthenticated(ctx).roles ?? [];
  if (roles.includes(ROLES.ADMIN) || roles.includes(ROLES.HR)) {
    return;
  }
  if (!IT_CATEGORIES.has(category ?? '')) {
    forbidden('IT may only publish maintenance, outage and security announcements');
  }
}

/** The category of an existing announcement, for the IT scope check on edit and delete. */
async function storedCategory(id: string): Promise<string | null> {
  if (!isValidObjectId(id)) {
    return null;
  }
  const row = await AnnouncementModel.findById(id).select('category').lean();
  return row?.category ?? null;
}

export const announcementsService = createCrudService<AnnouncementInput>(
  AnnouncementModel as never,
  'Announcement',
);

/** What the announcement grids search, filter and sort on — HR's and IT's alike. */
export const ANNOUNCEMENT_TABLE: TableConfig = {
  searchFields: ['title', 'body'],
  filterFields: ['title', 'category'],
  sortFields: ['title', 'category', 'pinned', 'publishedAt', 'createdAt'],
  defaultSort: { field: 'publishedAt', dir: 'DESC' },
};

const crud = createCrudResolvers(announcementsService, {
  name: 'Announcement',
  roles: [ROLES.HR, ROLES.IT],
  table: ANNOUNCEMENT_TABLE,
  stats: { countBy: ['category'] },
});

/** Everything live right now and aimed at the caller, pinned first then newest. */
async function activeAnnouncements(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  // A malformed id in a token must degrade to "no department", not fail the whole feed.
  const me = isValidObjectId(user.id)
    ? await UserModel.findById(user.id).select('department').lean()
    : null;
  const now = new Date();
  const rows = await AnnouncementModel.find({
    publishedAt: { $lte: now },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    $and: [
      {
        $or: [
          { audience: 'ALL' },
          { audience: 'DEPARTMENT', department: me?.department ?? '__none__' },
          { audience: 'EMPLOYEES', employeeIds: user.id },
        ],
      },
    ],
  })
    .sort({ pinned: -1, publishedAt: -1 })
    .lean();
  return withIds(rows as { _id: unknown }[]);
}

/**
 * Publishing wraps the generated create so the same audience gets a notification.
 * The fan-out is best-effort: a notification store hiccup must not block HR from
 * publishing, so its errors are logged by the caller's logger, not thrown here.
 */
const createAnnouncement = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: AnnouncementInput };
  assertAudience(input);
  assertMayPublish(ctx, input.category);
  const created = await crud.Mutation.createAnnouncement(p, args, ctx);
  await broadcast({
    kind: 'ANNOUNCEMENT',
    title: input.title,
    body: 'A new announcement was published.',
    link: '/me/announcements',
    audience: input.audience,
    department: input.department,
    employeeIds: input.employeeIds,
  }).catch(() => undefined);
  return created;
};

const updateAnnouncement = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: AnnouncementInput };
  assertAudience(input);
  assertMayPublish(ctx, input.category);
  assertMayPublish(ctx, await storedCategory(id));
  return crud.Mutation.updateAnnouncement(p, args, ctx);
};

const deleteAnnouncement = async (p: unknown, args: never, ctx: GraphQLContext) => {
  assertMayPublish(ctx, await storedCategory((args as unknown as { id: string }).id));
  return crud.Mutation.deleteAnnouncement(p, args, ctx);
};

export const announcementsResolvers = {
  Query: { ...crud.Query, activeAnnouncements },
  Mutation: { ...crud.Mutation, createAnnouncement, updateAnnouncement, deleteAnnouncement },
};
export { announcementsTypeDefs };
