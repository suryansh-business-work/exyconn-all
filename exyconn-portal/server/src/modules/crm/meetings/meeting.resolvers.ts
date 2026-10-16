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
  publicMeeting,
  publicSlots,
  type BookMeetingInput,
} from './meeting.booking.service';

const MODULE = 'MeetingType';
const crm = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, MODULE, [ROLES.CRM], action);

/** Anybody on the internet can book: ten bookings an hour from one address. */
const bookingLimiter = createLimiter({
  keyPrefix: 'meeting_booking',
  points: 10,
  durationSec: 60 * 60,
});
const MAX_PAGE = 100;

export const meetingResolvers = {
  Query: {
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
    publicMeeting: (_p: unknown, { slug }: { slug: string }) => publicMeeting(slug),
    publicMeetingSlots: (_p: unknown, { slug, from, to }: { slug: string; from: Date; to: Date }) =>
      publicSlots(slug, new Date(from), new Date(to)),
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
    bookMeeting: async (
      _p: unknown,
      { slug, input }: { slug: string; input: BookMeetingInput },
      ctx: GraphQLContext,
    ) => {
      if (!(await bookingLimiter.allow(ctx.ip ?? 'unknown'))) {
        badRequest('Too many bookings from here. Try again in an hour.');
      }
      return bookMeeting(slug, input);
    },
  },
};
