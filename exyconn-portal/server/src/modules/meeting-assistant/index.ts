import { maMeetingTypeDefs } from './ma.typeDefs';
import { maNotesTypeDefs } from './ma.notes.typeDefs';
import { maAdminTypeDefs } from './ma.admin.typeDefs';
import { maMeetingMutations, maMeetingQueries } from './ma.meeting.resolvers';
import { maNotesMutations, maNotesQueries } from './ma.notes.resolvers';
import { maAdminMutations, maAdminQueries } from './ma.admin.resolvers';

export const meetingAssistantTypeDefs = [maMeetingTypeDefs, maNotesTypeDefs, maAdminTypeDefs];

export const meetingAssistantResolvers = {
  Query: { ...maMeetingQueries, ...maNotesQueries, ...maAdminQueries },
  Mutation: { ...maMeetingMutations, ...maNotesMutations, ...maAdminMutations },
};

export { startMeetingAssistantWorker } from './ma.worker';
export { MA_REST_PATH, meetAssistantRouter } from './ma.routes';
export { GOOGLE_MEET_CALLBACK_PATH, googleMeetConnectRouter } from './google-meet.connect';
export { extensionMayRun } from './extension.fields';
export { extensionSessionIsLive } from './extension.auth';
