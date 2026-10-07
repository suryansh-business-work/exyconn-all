import {
  ANNOUNCEMENT_TABLE,
  announcementsResolvers,
  announcementsTypeDefs,
} from '../../../../src/modules/announcements';
import { AnnouncementModel } from '../../../../src/modules/announcements/announcement.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = announcementsResolvers.Query as unknown as Record<string, Resolver>;

const ctx = (id: string) =>
  ({ user: { id, email: 'p@exyconn.com', roles: [ROLES.EMPLOYEE] } }) as unknown as GraphQLContext;

const input = (over: Record<string, unknown> = {}) => ({
  title: 'Office closed',
  body: 'Friday off',
  category: 'NOTICE',
  pinned: false,
  audience: 'ALL',
  ...over,
});

describe('the employee feed and grid', () => {
  it('degrades a malformed token id to company-wide announcements only', async () => {
    await AnnouncementModel.create(
      input({ title: 'Everyone', publishedAt: new Date(Date.now() - 1000) }),
    );
    await AnnouncementModel.create(
      input({
        title: 'Sales',
        audience: 'DEPARTMENT',
        department: 'Sales',
        publishedAt: new Date(Date.now() - 1000),
      }),
    );

    const rows = (await Q.activeAnnouncements(null, {}, ctx('bad-id'))) as Array<{
      title: string;
    }>;

    expect(rows.map((row) => row.title)).toEqual(['Everyone']);
  });

  it('sorts the grid newest-published first by default and ships its schema', () => {
    expect(ANNOUNCEMENT_TABLE.defaultSort).toEqual({ field: 'publishedAt', dir: 'DESC' });
    expect(announcementsTypeDefs).toBeDefined();
  });
});
