import { trackerResolvers as coreResolvers } from './tracker.resolvers';
import { trackerLocationResolvers } from './tracker.location.resolvers';

export { trackerTypeDefs } from './tracker.typeDefs';
export { startTrackerRetention } from './tracker.retention';
export { startTrackerDigest } from './tracker.digest';
export { trackerMessageService } from './tracker.message.service';
export { isAwayPresence, presenceOf, setPresence } from './tracker.presence.service';
export * from './models';

/** The tracker's resolvers: the desk, the devices, and the location and earnings reads. */
export const trackerResolvers = {
  Query: { ...coreResolvers.Query, ...trackerLocationResolvers.Query },
  Mutation: { ...coreResolvers.Mutation, ...trackerLocationResolvers.Mutation },
};
