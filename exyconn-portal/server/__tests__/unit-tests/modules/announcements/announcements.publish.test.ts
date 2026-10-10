import { Types } from 'mongoose';
import { announcementsResolvers } from '../../../../src/modules/announcements';
import { AnnouncementModel } from '../../../../src/modules/announcements/announcement.model';
import * as notifications from '../../../../src/modules/notifications/notifications.service';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = announcementsResolvers.Mutation as unknown as Record<string, Resolver>;

const ctx = (roles: Role[], id = new Types.ObjectId().toHexString()) =>
  ({ user: { id, email: 'p@exyconn.com', roles } }) as unknown as GraphQLContext;
const asHr = ctx([ROLES.HR]);
const asIt = ctx([ROLES.IT]);

const input = (over: Record<string, unknown> = {}) => ({
  title: 'Office closed',
  body: 'Friday off',
  category: 'NOTICE',
  pinned: false,
  publishedAt: new Date(),
  audience: 'ALL',
  ...over,
});

const stored = async (category: string) =>
  (await AnnouncementModel.create(input({ category })))._id.toHexString();

let broadcast: jest.SpyInstance;
beforeEach(() => {
  broadcast = jest.spyOn(notifications, 'broadcast').mockResolvedValue(3);
});
afterEach(() => jest.restoreAllMocks());

describe('createAnnouncement', () => {
  it('publishes and notifies the same audience', async () => {
    const created = (await M.createAnnouncement(
      null,
      { input: input({ audience: 'DEPARTMENT', department: 'Sales' }) },
      asHr,
    )) as { id: string; title: string };

    expect(created).toMatchObject({ id: expect.any(String), title: 'Office closed' });
    expect(broadcast).toHaveBeenCalledWith({
      kind: 'ANNOUNCEMENT',
      title: 'Office closed',
      body: 'A new announcement was published.',
      link: '/me/announcements',
      audience: 'DEPARTMENT',
      department: 'Sales',
      employeeIds: undefined,
    });
  });

  it('still publishes when the notification fan-out fails', async () => {
    broadcast.mockRejectedValue(new Error('notification store down'));

    await expect(M.createAnnouncement(null, { input: input() }, asHr)).resolves.toMatchObject({
      title: 'Office closed',
    });
    expect(await AnnouncementModel.countDocuments()).toBe(1);
  });

  it('refuses an audience that would reach nobody', async () => {
    await expect(
      M.createAnnouncement(null, { input: input({ audience: 'DEPARTMENT' }) }, asHr),
    ).rejects.toThrow('department is required for a DEPARTMENT audience');
    await expect(
      M.createAnnouncement(
        null,
        { input: input({ audience: 'EMPLOYEES', employeeIds: [] }) },
        asHr,
      ),
    ).rejects.toThrow('employeeIds is required for an EMPLOYEES audience');
    await expect(
      M.createAnnouncement(null, { input: input({ audience: 'EMPLOYEES' }) }, asHr),
    ).rejects.toThrow('employeeIds is required');
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('accepts a by-name announcement with its people', async () => {
    const employeeIds = [new Types.ObjectId().toHexString()];

    await M.createAnnouncement(
      null,
      { input: input({ audience: 'EMPLOYEES', employeeIds }) },
      asHr,
    );

    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ audience: 'EMPLOYEES', employeeIds }),
    );
  });

  it('lets IT publish only its own kinds', async () => {
    await expect(
      M.createAnnouncement(null, { input: input({ category: 'OUTAGE' }) }, asIt),
    ).resolves.toMatchObject({ category: 'OUTAGE' });
    await expect(
      M.createAnnouncement(null, { input: input({ category: 'POLICY' }) }, asIt),
    ).rejects.toThrow('IT may only publish maintenance, outage and security announcements');
  });

  it('refuses an anonymous caller', async () => {
    await expect(M.createAnnouncement(null, { input: input() }, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('updateAnnouncement', () => {
  it('lets HR edit anything', async () => {
    const id = await stored('SECURITY_ALERT');

    await expect(
      M.updateAnnouncement(null, { id, input: input({ category: 'EVENT', title: 'Party' }) }, asHr),
    ).resolves.toMatchObject({ title: 'Party', category: 'EVENT' });
  });

  it('lets IT edit its own kind', async () => {
    const id = await stored('MAINTENANCE');

    await expect(
      M.updateAnnouncement(null, { id, input: input({ category: 'OUTAGE' }) }, asIt),
    ).resolves.toMatchObject({ category: 'OUTAGE' });
  });

  it('stops IT re-labelling an HR announcement as its own kind', async () => {
    const id = await stored('POLICY');

    await expect(
      M.updateAnnouncement(null, { id, input: input({ category: 'MAINTENANCE' }) }, asIt),
    ).rejects.toThrow(/IT may only publish/);
    expect((await AnnouncementModel.findById(id).lean())?.category).toBe('POLICY');
  });

  it('refuses IT on a malformed id, and the audience rule applies on edit too', async () => {
    await expect(
      M.updateAnnouncement(null, { id: 'not-an-id', input: input({ category: 'OUTAGE' }) }, asIt),
    ).rejects.toThrow(/IT may only publish/);
    const id = await stored('NOTICE');
    await expect(
      M.updateAnnouncement(null, { id, input: input({ audience: 'DEPARTMENT' }) }, asHr),
    ).rejects.toThrow(/department is required/);
  });
});

describe('deleteAnnouncement', () => {
  it('lets IT delete its own kind but not anybody else’s', async () => {
    const outage = await stored('OUTAGE');
    const policy = await stored('POLICY');

    await expect(M.deleteAnnouncement(null, { id: outage }, asIt)).resolves.toBe(true);
    await expect(M.deleteAnnouncement(null, { id: policy }, asIt)).rejects.toThrow(/IT may only/);
    expect(await AnnouncementModel.countDocuments()).toBe(1);
  });

  it('refuses IT an announcement that no longer exists', async () => {
    await expect(
      M.deleteAnnouncement(null, { id: new Types.ObjectId().toHexString() }, asIt),
    ).rejects.toThrow(/IT may only/);
  });

  it('lets HR delete anything', async () => {
    const id = await stored('SECURITY_ALERT');

    await expect(M.deleteAnnouncement(null, { id }, asHr)).resolves.toBe(true);
  });
});

describe('a token without roles', () => {
  it('is held to the IT kinds, and then refused by the grid’s own role guard', async () => {
    const bare = {
      user: { id: new Types.ObjectId().toHexString(), email: 'b@exyconn.com' },
    } as unknown as GraphQLContext;

    await expect(M.createAnnouncement(null, { input: input() }, bare)).rejects.toThrow(
      /IT may only publish/,
    );
    await expect(
      M.createAnnouncement(null, { input: input({ category: 'OUTAGE' }) }, bare),
    ).rejects.toThrow();
    expect(await AnnouncementModel.countDocuments()).toBe(0);
  });
});
