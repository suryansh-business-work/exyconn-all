import { AnnouncementModel } from '../../src/modules/announcements/announcement.model';
import { announcementsResolvers } from '../../src/modules/announcements';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const ctx = (roles: string[] = [ROLES.EMPLOYEE]) =>
  ({ user: { id: 'u1', email: 'e@exyconn.com', roles } }) as unknown as GraphQLContext;

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = announcementsResolvers.Query as unknown as Record<string, Resolver>;

const active = async (): Promise<{ id: string; title: string }[]> =>
  (await Q.activeAnnouncements(null, {}, ctx())) as { id: string; title: string }[];

const HOUR = 60 * 60 * 1000;
const make = (title: string, over: Record<string, unknown> = {}) =>
  AnnouncementModel.create({
    title,
    body: 'body',
    category: 'NOTICE',
    pinned: false,
    publishedAt: new Date(Date.now() - HOUR),
    ...over,
  });

describe('activeAnnouncements', () => {
  it('hides announcements scheduled for the future', async () => {
    await make('Live');
    await make('Scheduled', { publishedAt: new Date(Date.now() + HOUR) });
    expect((await active()).map((a) => a.title)).toEqual(['Live']);
  });

  it('hides expired ones but keeps those with no expiry', async () => {
    await make('Expired', { expiresAt: new Date(Date.now() - HOUR) });
    await make('Never expires', { expiresAt: null });
    await make('Expires later', { expiresAt: new Date(Date.now() + HOUR) });
    const titles = (await active()).map((a) => a.title);
    expect(titles).toContain('Never expires');
    expect(titles).toContain('Expires later');
    expect(titles).not.toContain('Expired');
  });

  it('sorts pinned first, then newest', async () => {
    await make('Older', { publishedAt: new Date(Date.now() - 3 * HOUR) });
    await make('Newer', { publishedAt: new Date(Date.now() - HOUR) });
    await make('Pinned old', { pinned: true, publishedAt: new Date(Date.now() - 5 * HOUR) });
    expect((await active()).map((a) => a.title)).toEqual(['Pinned old', 'Newer', 'Older']);
  });

  it('serialises the mongo id as `id` for GraphQL', async () => {
    await make('Live');
    const [row] = await active();
    expect(typeof row.id).toBe('string');
    expect(row.id).not.toHaveLength(0);
  });

  it('is readable by a plain employee but the CRUD list is not', async () => {
    await make('Live');
    await expect(active()).resolves.toHaveLength(1);
    await expect(Q.listAnnouncements(null, {}, ctx([ROLES.EMPLOYEE]))).rejects.toThrow();
  });
});
