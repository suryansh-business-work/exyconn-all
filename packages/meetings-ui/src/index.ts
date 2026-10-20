/**
 * `@exyconn/meetings-ui` — the Meeting Assistant screens. Mounted by the AI portal for the whole
 * company (`scope="ALL"`) and by My Workspace for the viewer's own meetings (`scope="MINE"`).
 * Every page takes the base path it lives under, so both apps share one set of screens.
 */
export { MeetingDashboardPage } from './dashboard/MeetingDashboardPage';
export { MeetingsListPage } from './meetings/MeetingsListPage';
export { MeetingDetailPage } from './detail/MeetingDetailPage';
export { TranscriptsPage } from './transcripts/TranscriptsPage';
export { ActionChecklistPage } from './actions/ActionChecklistPage';
export { ActionChecklist } from './actions/ActionChecklist';
export { ParticipantsPage } from './participants/ParticipantsPage';
export { ExtensionPage } from './extension/ExtensionPage';
export { ConnectExtensionPage } from './connect/ConnectExtensionPage';
export { MeetingSettingsPage } from './settings/MeetingSettingsPage';
export { ReleasesPage } from './releases/ReleasesPage';
export { LogsPage } from './events/LogsPage';
export { meetingPaths, type MeetingPageProps, type MeetingScope } from './lib/scope';
