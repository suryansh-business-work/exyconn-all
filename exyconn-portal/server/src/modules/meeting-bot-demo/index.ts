import { demoCallerOf } from '../../lib/demoCaller';
import type { GraphQLContext } from '../../middleware/auth';
import {
  cancelDemoTrip,
  demoInfo,
  demoTrip,
  demoTrips,
  sendDemoBot,
} from './meetingBotDemo.service';

export { meetingBotDemoTypeDefs } from './meetingBotDemo.typeDefs';
export { ensureMeetingBotDemo } from './meetingBotDemo.org';
export { startMeetingBotDemoSweep } from './meetingBotDemo.sweep';

type Id = { id: string };

/**
 * The meeting bot demo: a demo visitor (or an employee) sends the Meeting Assistant's bot into
 * their own Google Meet call and reads its notes. Everything runs in the demo company; a caller
 * only ever reaches their own trips.
 */
export const meetingBotDemoResolvers = {
  Query: {
    meetingBotDemoInfo: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      demoInfo(await demoCallerOf(ctx)),
    meetingBotDemoTrips: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      demoTrips(await demoCallerOf(ctx)),
    meetingBotDemoTrip: async (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      demoTrip(await demoCallerOf(ctx), id),
  },
  Mutation: {
    sendMeetingBotDemo: async (
      _p: unknown,
      args: { meetUrl: string; consent: boolean },
      ctx: GraphQLContext,
    ) => sendDemoBot(await demoCallerOf(ctx), args, ctx.ip ?? ''),
    cancelMeetingBotDemo: async (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      cancelDemoTrip(await demoCallerOf(ctx), id),
  },
};
