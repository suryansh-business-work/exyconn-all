import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
import { tableQuery, type TableQueryInput } from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';
import { AnnouncementModel } from '../announcements/announcement.model';
import { ANNOUNCEMENT_TABLE } from '../announcements';
import { IT_POLICY_CATEGORIES, PolicyModel } from '../legal/policy.model';
import { POLICY_TABLE } from '../legal/policy.resolvers';
import { IT_ANNOUNCEMENT } from './itsm.queries';

type PageArgs = { input: TableQueryInput };

/**
 * IT's slices of two shared registers. The owning modules' own grids stay as they are; these
 * narrow them to what the IT portal shows, so an ADMIN opening IT sees IT's announcements and
 * policies rather than the whole company's.
 */
export const itScopedListResolvers = {
  listItAnnouncementsPaged: async (_p: unknown, { input }: PageArgs, ctx: GraphQLContext) => {
    await assertPermission(ctx, 'Announcement', [ROLES.HR, ROLES.IT], 'VIEW');
    const page = await tableQuery(AnnouncementModel, input, ANNOUNCEMENT_TABLE, IT_ANNOUNCEMENT);
    return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
  },
  listItPoliciesPaged: async (_p: unknown, { input }: PageArgs, ctx: GraphQLContext) => {
    await assertPermission(ctx, 'Policy', [ROLES.LEGAL, ROLES.IT], 'VIEW');
    const scope = { category: { $in: [...IT_POLICY_CATEGORIES] } };
    const page = await tableQuery(PolicyModel, input, POLICY_TABLE, scope);
    return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
  },
};
