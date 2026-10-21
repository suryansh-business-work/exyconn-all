import { onlyRootFields } from '../../utils/graphqlRootFields';

/**
 * Every root field the Chrome extension calls (exyconn-meet-extension operations). An
 * extension token is a narrow credential: whatever its holder's roles, a request carrying one
 * may only run these. Adding an operation to the extension means adding its root field here.
 */
export const MA_EXTENSION_FIELDS: ReadonlySet<string> = new Set([
  '__typename',
  'localeBundle',
  'maActionItemsPaged',
  'maActionStats',
  'maDecisions',
  'maExtensionContext',
  'maFinalizeSession',
  'maFollowUp',
  'maHeartbeat',
  'maLatestRelease',
  'maMeeting',
  'maNotes',
  'maParticipants',
  'maRecordConsent',
  'maRecordParticipantEvents',
  'maSetActionStatus',
  'maStartSession',
  'maTranscript',
  'reportClientLogs',
]);

/** Whether a GraphQL request may run on an extension token. */
export const extensionMayRun = (query: unknown): boolean =>
  onlyRootFields(query, MA_EXTENSION_FIELDS);
