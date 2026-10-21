import {
  LocaleBundleDocument,
  MaActionItemsDocument,
  MaExtensionContextDocument,
  MaFinalizeSessionDocument,
  MaFollowUpDocument,
  MaHeartbeatDocument,
  MaLatestReleaseDocument,
  MaNotesDocument,
  MaParticipantsDocument,
  MaRecordConsentDocument,
  MaRecordParticipantEventsDocument,
  MaSetActionStatusDocument,
  MaStartSessionDocument,
  MaTranscriptDocument,
  ReportClientLogsDocument,
  type AppLogBatchInput,
  type MaActionStatus,
  type MaHeartbeatInput,
  type MaParticipantEventInput,
  type MaStartSessionInput,
} from '../graphql/generated';
import type { Messages } from '@exyconn/i18n';
import type { GraphqlClient } from './api';

/** The server caps one participant batch at this many events. */
export const PARTICIPANT_BATCH_SIZE = 50;
/** Most transcript lines one poll asks for (the server caps it at 500). */
export const TRANSCRIPT_PAGE = 200;
/** Action items shown per page in the panel. */
export const ACTIONS_PAGE_SIZE = 20;

/**
 * Every portal call the extension makes, one function each. Only allow-listed root fields
 * are used (the server refuses anything else from an extension token).
 */
export function createMeetApi(client: GraphqlClient) {
  return {
    extensionContext: async () =>
      (await client.request(MaExtensionContextDocument, {})).maExtensionContext,
    startSession: async (input: MaStartSessionInput) =>
      (await client.request(MaStartSessionDocument, { input })).maStartSession,
    recordConsent: async (meetingId: string) =>
      (await client.request(MaRecordConsentDocument, { meetingId })).maRecordConsent,
    heartbeat: async (meetingId: string, input: MaHeartbeatInput) =>
      (await client.request(MaHeartbeatDocument, { meetingId, input })).maHeartbeat,
    recordParticipantEvents: async (meetingId: string, events: MaParticipantEventInput[]) =>
      (await client.request(MaRecordParticipantEventsDocument, { meetingId, events }))
        .maRecordParticipantEvents,
    finalize: async (meetingId: string, endedAt: string) =>
      (await client.request(MaFinalizeSessionDocument, { meetingId, endedAt })).maFinalizeSession,
    followUp: async (meetingId: string) =>
      (await client.request(MaFollowUpDocument, { meetingId })).maFollowUp,
    transcript: async (meetingId: string, afterMs: number | null) =>
      (await client.request(MaTranscriptDocument, { meetingId, afterMs, limit: TRANSCRIPT_PAGE }))
        .maTranscript,
    participants: async (meetingId: string) =>
      (await client.request(MaParticipantsDocument, { meetingId })).maParticipants,
    notes: (meetingId: string) => client.request(MaNotesDocument, { meetingId }),
    actions: async (meetingId: string, page: number) =>
      (
        await client.request(MaActionItemsDocument, {
          meetingId,
          input: {
            page,
            pageSize: ACTIONS_PAGE_SIZE,
            search: null,
            sort: null,
            sorts: null,
            filters: null,
            archived: null,
          },
        })
      ).maActionItemsPaged,
    setActionStatus: async (id: string, status: MaActionStatus) =>
      (await client.request(MaSetActionStatusDocument, { id, status })).maSetActionStatus,
    latestRelease: async () => (await client.request(MaLatestReleaseDocument, {})).maLatestRelease,
    reportLogs: async (input: AppLogBatchInput) =>
      (await client.request(ReportClientLogsDocument, { input }, { allowAnonymous: true }))
        .reportClientLogs,
    localeMessages: async (locale: string): Promise<Messages> => {
      const { localeBundle } = await client.request(
        LocaleBundleDocument,
        { locale },
        { allowAnonymous: true },
      );
      return Object.fromEntries(localeBundle.translations.map((t) => [t.source, t.text]));
    },
  };
}

export type MeetApi = ReturnType<typeof createMeetApi>;
