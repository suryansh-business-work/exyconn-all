import { maMeetingTypeDefs } from './ma.typeDefs';
import { maNotesTypeDefs } from './ma.notes.typeDefs';
import { maAdminTypeDefs } from './ma.admin.typeDefs';
import { maModelsTypeDefs } from './ma.models.typeDefs';
import { maReleaseTypeDefs } from './ma.release.typeDefs';
import { maCalendarTypeDefs } from './ma.calendar.typeDefs';
import { maBotTypeDefs } from './ma.bot.typeDefs';
import { maMeetingMutations, maMeetingQueries } from './ma.meeting.resolvers';
import { maNotesMutations, maNotesQueries } from './ma.notes.resolvers';
import { maAdminMutations, maAdminQueries } from './ma.admin.resolvers';
import { maModelQueries } from './ma.models';
import { maReleaseMutations, maReleaseQueries } from './ma.release.resolvers';
import { maCalendarQueries } from './ma.calendar.resolvers';
import { maBotMutations, maBotQueries } from './ma.bot.resolvers';

export const meetingAssistantTypeDefs = [
  maMeetingTypeDefs,
  maNotesTypeDefs,
  maAdminTypeDefs,
  maModelsTypeDefs,
  maReleaseTypeDefs,
  maCalendarTypeDefs,
  maBotTypeDefs,
];

export const meetingAssistantResolvers = {
  Query: {
    ...maMeetingQueries,
    ...maNotesQueries,
    ...maAdminQueries,
    ...maModelQueries,
    ...maReleaseQueries,
    ...maCalendarQueries,
    ...maBotQueries,
  },
  Mutation: {
    ...maMeetingMutations,
    ...maNotesMutations,
    ...maAdminMutations,
    ...maReleaseMutations,
    ...maBotMutations,
  },
};

export { startMeetingAssistantWorker } from './ma.worker';
export { MA_REST_PATH, meetAssistantRouter } from './ma.routes';
export { GOOGLE_MEET_CALLBACK_PATH, googleMeetConnectRouter } from './google-meet.connect';
export { extensionMayRun } from './extension.fields';
export { extensionSessionIsLive } from './extension.auth';
