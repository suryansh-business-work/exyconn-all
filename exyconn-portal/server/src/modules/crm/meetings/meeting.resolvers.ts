import { ROLES } from '../../../constants/roles';
import { assertPermission } from '../../../lib/permissions';
import { createLimiter } from '../../../lib/rateLimiter';
import type { GraphQLContext } from '../../../middleware/auth';
import type { PermissionAction } from '../../permissions/permission.model';
import { badRequest, notFound } from '../../../utils/errors';
import { withId, withIds } from '../../../utils/serialize';
import { UserModel } from '../../admin/user.model';
import { MeetingBookingModel } from './meeting.models';
import { meetingTypes, type MeetingTypeInput } from './meeting.types.service';
import {
  bookMeeting,
  publicBookingPage,
  publicMeeting,
  publicSlots,
  trackMeetingView,
  type BookingAddress,
  type BookMeetingInput,
} from './meeting.booking.service';
import {
  meetingSettings,
  saveMeetingSettings,
  type MeetingSettingsInput,
} from './meeting.settings';
import { meetingTracking } from './meeting.visits';
import { slackNotifier } from '../../../utils/slack';

const MODULE = 'MeetingType';
const crm = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, MODULE, [ROLES.CRM], action);

/** Anybody on the internet can book: ten bookings an hour from one address. */
const bookingLimiter = createLimiter({
  keyPrefix: 'meeting_booking',
  points: 10,
  durationSec: 60 * 60,
});
/** A visit is counted at most this often from one address (which is never stored). */
const viewLimiter = createLimiter({ keyPrefix: 'meeting_view', points: 60, durationSec: 60 * 60 });
const MAX_PAGE = 100;

/** The booking page's part of the company's CRM address. */
const bookingPagePath = async () => `/book/${(await meetingSettings()).bookingSlug}`;

type Args = BookingAddress & { slug: string };

export const meetingResolvers = {
  MeetingType: {
    bookingPath: async (row: { slug: string }) => `${await bookingPagePath()}/${row.slug}`,
  },
  MeetingBooking: {
    guests: (row: { guests?: string[] | null }) => row.guests ?? [],
    country: (row: { country?: string | null }) => row.country ?? '',
  },
  Query: {
    meetingBookingPagePath: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crm(ctx, 'VIEW');
      return bookingPagePath();
    },
    meetingSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crm(ctx, 'VIEW');
      return meetingSettings();
    },
    meetingSlackChannels: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crm(ctx, 'EDIT');
      return slackNotifier.listChannels();
    },
    meetingTracking: async (_p: unknown, { days }: { days: number }, ctx: GraphQLContext) => {
      await crm(ctx, 'VIEW');
      return meetingTracking(days);
    },
    publicBookingPage: (_p: unknown, at: BookingAddress) => publicBookingPage(at),
    meetingTypes: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crm(ctx, 'VIEW');
      return withIds(await meetingTypes.list());
    },
    meetingBookings: async (
      _p: unknown,
      { page, pageSize }: { page: number; pageSize: number },
      ctx: GraphQLContext,
    ) => {
      await crm(ctx, 'VIEW');
      const size = Math.min(Math.max(pageSize, 1), MAX_PAGE);
      const [rows, totalCount] = await Promise.all([
        MeetingBookingModel.find()
          .sort({ startAt: -1 })
          .skip(Math.max(page, 0) * size)
          .limit(size)
          .lean(),
        MeetingBookingModel.countDocuments(),
      ]);
      return { rows: withIds(rows), totalCount };
    },
    publicMeeting: (_p: unknown, { slug, ...at }: Args) => publicMeeting(at, slug),
    publicMeetingSlots: (_p: unknown, { slug, from, to, ...at }: Args & { from: Date; to: Date }) =>
      publicSlots(at, slug, new Date(from), new Date(to)),
  },
  Mutation: {
    createMeetingType: async (
      _p: unknown,
      { input }: { input: MeetingTypeInput },
      ctx: GraphQLContext,
    ) => {
      const user = await crm(ctx, 'CREATE');
      const host = await UserModel.findById(user.id).select('name email').lean();
      if (!host) notFound('User');
      return withId(
        await meetingTypes.create(input, { id: user.id, name: host.name, email: host.email }),
      );
    },
    updateMeetingType: async (
      _p: unknown,
      { id, input }: { id: string; input: MeetingTypeInput },
      ctx: GraphQLContext,
    ) => {
      await crm(ctx, 'EDIT');
      return withId(await meetingTypes.update(id, input));
    },
    deleteMeetingType: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await crm(ctx, 'DELETE');
      return meetingTypes.remove(id);
    },
    cancelMeetingBooking: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await crm(ctx, 'EDIT');
      const doc = await MeetingBookingModel.findByIdAndUpdate(
        id,
        { status: 'CANCELLED' },
        { new: true },
      ).lean();
      if (!doc) notFound('Booking');
      return withId(doc);
    },
    saveMeetingSettings: async (
      _p: unknown,
      { input }: { input: MeetingSettingsInput },
      ctx: GraphQLContext,
    ) => {
      await crm(ctx, 'EDIT');
      return saveMeetingSettings(input);
    },
    bookMeeting: async (
      _p: unknown,
      { slug, input, ...at }: Args & { input: BookMeetingInput },
      ctx: GraphQLContext,
    ) => {
      if (!(await bookingLimiter.allow(ctx.ip ?? 'unknown'))) {
        badRequest('Too many bookings from here. Try again in an hour.');
      }
      return bookMeeting(at, slug, input);
    },
    trackMeetingView: async (
      _p: unknown,
      { slug, timezone, ...at }: Args & { timezone?: string | null },
      ctx: GraphQLContext,
    ) => {
      if (!(await viewLimiter.allow(ctx.ip ?? 'unknown'))) {
        return false;
      }
      return trackMeetingView(at, slug, timezone);
    },
  },
};
