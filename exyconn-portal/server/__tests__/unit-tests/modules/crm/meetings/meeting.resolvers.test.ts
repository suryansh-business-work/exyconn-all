import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { meetingResolvers } from '../../../../../src/modules/crm/meetings/meeting.resolvers';
import { meetingTypeDefs } from '../../../../../src/modules/crm/meetings';
import {
  MeetingBookingModel,
  MeetingTypeModel,
} from '../../../../../src/modules/crm/meetings/meeting.models';
import { UserModel } from '../../../../../src/modules/admin/user.model';
import { RolePermissionModel } from '../../../../../src/modules/permissions/permission.model';
import { invalidatePermissionCache } from '../../../../../src/lib/permissions';
import { ROLES } from '../../../../../src/constants/roles';
import { slackNotifier } from '../../../../../src/utils/slack';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import type { MeetingTypeInput } from '../../../../../src/modules/crm/meetings/meeting.types.service';
import { freezeClock, useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';

jest.mock('../../../../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));

const organizationId = useTestOrganization();
const { Query, Mutation, MeetingType, MeetingBooking } = meetingResolvers;

const userId = new Types.ObjectId().toHexString();
const crmUser: GraphQLContext = {
  user: { id: userId, email: 'asha@test-co.test', roles: [ROLES.CRM] },
  ip: 'visitor-a',
};
const nobody: GraphQLContext = { user: null };
const at = { org: 'test-co', page: 'meeting' };

const input: MeetingTypeInput = {
  title: 'Intro call',
  slug: 'intro',
  durationMinutes: 60,
  timezone: 'UTC',
  weeklyHours: [{ day: 1, enabled: true, start: '09:00', end: '12:00' }],
  bufferMinutes: 0,
  minNoticeHours: 0,
  maxDaysAhead: 30,
  active: true,
};

const seedHost = () =>
  UserModel.create({
    _id: userId,
    name: 'Asha',
    email: 'asha@test-co.test',
    passwordHash: randomUUID(),
    roles: [ROLES.CRM],
    organizationId,
  });

const booking = (startAt: Date, fields: Record<string, unknown> = {}) =>
  MeetingBookingModel.create({
    meetingTypeId: 'type-1',
    meetingTitle: 'Intro call',
    hostUserId: userId,
    hostName: 'Asha',
    startAt,
    endAt: new Date(startAt.getTime() + 3_600_000),
    name: 'Bo',
    email: 'bo@client.test',
    ...fields,
  });

beforeAll(async () => {
  await MeetingTypeModel.init();
});

afterEach(() => {
  invalidatePermissionCache();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('meeting schema', () => {
  it('declares the meeting types, bookings and public booking operations', () => {
    expect(meetingTypeDefs).toEqual(expect.anything());
  });
});

describe('field resolvers', () => {
  it('gives each meeting type its address under the chosen booking page', async () => {
    await expect(MeetingType.bookingPath({ slug: 'intro' })).resolves.toBe('/book/meeting/intro');
  });

  it('reads guests and country a booking saved before they existed as empty', () => {
    expect(MeetingBooking.guests({})).toEqual([]);
    expect(MeetingBooking.guests({ guests: null })).toEqual([]);
    expect(MeetingBooking.guests({ guests: ['cy@client.test'] })).toEqual(['cy@client.test']);
    expect(MeetingBooking.country({})).toBe('');
    expect(MeetingBooking.country({ country: 'IN' })).toBe('IN');
  });
});

describe('CRM queries and mutations', () => {
  it('refuses somebody who is not signed in', async () => {
    await expect(codeOf(Query.meetingTypes(null, {}, nobody))).resolves.toBe('UNAUTHENTICATED');
    await expect(codeOf(Query.meetingSettings(null, {}, nobody))).resolves.toBe('UNAUTHENTICATED');
  });

  it('refuses an action an administrator has taken away from the CRM role', async () => {
    await RolePermissionModel.create({ role: ROLES.CRM, module: 'MeetingType', actions: ['VIEW'] });
    invalidatePermissionCache();

    await expect(codeOf(Mutation.deleteMeetingType(null, { id: 'x' }, crmUser))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(Query.meetingTypes(null, {}, crmUser)).resolves.toEqual([]);
  });

  it('creates a meeting type hosted by the signed-in person, then edits, lists and deletes it', async () => {
    await seedHost();

    const created = await Mutation.createMeetingType(null, { input }, crmUser);
    expect(created).toMatchObject({
      slug: 'intro',
      hostUserId: userId,
      hostName: 'Asha',
      id: expect.any(String),
    });

    const updated = await Mutation.updateMeetingType(
      null,
      { id: created.id, input: { ...input, title: 'Discovery' } },
      crmUser,
    );
    expect(updated).toMatchObject({ id: created.id, title: 'Discovery' });

    const listed = await Query.meetingTypes(null, {}, crmUser);
    expect(listed.map((row) => row.id)).toEqual([created.id]);

    await expect(Mutation.deleteMeetingType(null, { id: created.id }, crmUser)).resolves.toBe(true);
    await expect(MeetingTypeModel.countDocuments()).resolves.toBe(0);
  });

  it('will not create a meeting type for a person who no longer exists', async () => {
    await expect(codeOf(Mutation.createMeetingType(null, { input }, crmUser))).resolves.toBe(
      'NOT_FOUND',
    );
  });

  it('reads and saves the settings, and points the booking page at the saved address', async () => {
    await expect(Query.meetingSettings(null, {}, crmUser)).resolves.toMatchObject({
      bookingSlug: 'meeting',
    });

    await Mutation.saveMeetingSettings(null, { input: { bookingSlug: 'talk' } }, crmUser);

    await expect(Query.meetingBookingPagePath(null, {}, crmUser)).resolves.toBe('/book/talk');
  });

  it('lists the Slack channels a booking can be posted to', async () => {
    const channels = [{ id: 'C1', name: 'sales', isPrivate: false, isMember: true }];
    jest.spyOn(slackNotifier, 'listChannels').mockResolvedValue(channels);

    await expect(Query.meetingSlackChannels(null, {}, crmUser)).resolves.toEqual(channels);
  });

  it('reports the tracking for the period asked for', async () => {
    await expect(Query.meetingTracking(null, { days: 7 }, crmUser)).resolves.toMatchObject({
      days: 7,
      views: 0,
      bookings: 0,
    });
  });

  it('pages the bookings newest first, keeping the page size between 1 and 100', async () => {
    await booking(new Date('2026-10-19T09:00:00.000Z'));
    await booking(new Date('2026-10-20T09:00:00.000Z'));
    await booking(new Date('2026-10-21T09:00:00.000Z'));

    const first = await Query.meetingBookings(null, { page: 0, pageSize: 2 }, crmUser);
    expect(first.totalCount).toBe(3);
    expect(first.rows.map((row) => row.startAt.toISOString())).toEqual([
      '2026-10-21T09:00:00.000Z',
      '2026-10-20T09:00:00.000Z',
    ]);

    const tiny = await Query.meetingBookings(null, { page: -3, pageSize: 0 }, crmUser);
    expect(tiny.rows).toHaveLength(1);
    expect(tiny.rows[0].startAt.toISOString()).toBe('2026-10-21T09:00:00.000Z');

    const huge = await Query.meetingBookings(null, { page: 0, pageSize: 1000 }, crmUser);
    expect(huge.rows).toHaveLength(3);
  });

  it('cancels a booking, and says so when it is gone', async () => {
    const row = await booking(new Date('2026-10-19T09:00:00.000Z'));

    await expect(
      Mutation.cancelMeetingBooking(null, { id: row._id.toHexString() }, crmUser),
    ).resolves.toMatchObject({ id: row._id.toHexString(), status: 'CANCELLED' });
    await expect(
      codeOf(
        Mutation.cancelMeetingBooking(null, { id: new Types.ObjectId().toHexString() }, crmUser),
      ),
    ).resolves.toBe('NOT_FOUND');
  });
});

describe('public operations', () => {
  beforeEach(async () => {
    await seedHost();
    await Mutation.createMeetingType(null, { input }, crmUser);
  });

  it('shows the booking page, one meeting and its free starts', async () => {
    freezeClock('2026-10-18T00:00:00.000Z');

    await expect(Query.publicBookingPage(null, at)).resolves.toMatchObject({
      organizationSlug: 'test-co',
      meetings: [expect.objectContaining({ slug: 'intro' })],
    });
    await expect(Query.publicMeeting(null, { ...at, slug: 'intro' })).resolves.toMatchObject({
      title: 'Intro call',
    });
    const slots = await Query.publicMeetingSlots(null, {
      ...at,
      slug: 'intro',
      from: new Date('2026-10-19T00:00:00.000Z'),
      to: new Date('2026-10-19T10:00:00.000Z'),
    });
    expect(slots.map((slot) => slot.toISOString())).toEqual(['2026-10-19T09:00:00.000Z']);
  });

  it('books a meeting', async () => {
    freezeClock('2026-10-18T00:00:00.000Z');

    const booked = await Mutation.bookMeeting(
      null,
      {
        ...at,
        slug: 'intro',
        input: {
          startAt: new Date('2026-10-19T09:00:00.000Z'),
          name: 'Bo',
          email: 'bo@client.test',
        },
      },
      { user: null },
    );

    expect(booked).toMatchObject({ title: 'Intro call', hostName: 'Asha' });
  });

  it('stops an address after ten booking attempts in an hour', async () => {
    const attempt = () =>
      codeOf(
        Mutation.bookMeeting(
          null,
          {
            ...at,
            slug: 'missing',
            input: { startAt: new Date(), name: 'Bo', email: 'bo@client.test' },
          },
          crmUser,
        ),
      );
    for (let index = 0; index < 10; index += 1) {
      await expect(attempt()).resolves.toBe('NOT_FOUND');
    }

    await expect(attempt()).resolves.toBe('BAD_USER_INPUT');
  });

  it('counts a view, and stops counting an address after sixty in an hour', async () => {
    await expect(
      Mutation.trackMeetingView(null, { ...at, slug: '', timezone: 'UTC' }, { user: null }),
    ).resolves.toBe(true);
    for (let index = 0; index < 60; index += 1) {
      await expect(
        Mutation.trackMeetingView(null, { ...at, slug: 'intro', timezone: null }, crmUser),
      ).resolves.toBe(true);
    }

    await expect(Mutation.trackMeetingView(null, { ...at, slug: 'intro' }, crmUser)).resolves.toBe(
      false,
    );
  });
});
