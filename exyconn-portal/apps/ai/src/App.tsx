import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { ProtectedRoute } from '@exyconn/shell/routes/ProtectedRoute';
import { Login } from '@exyconn/login';
import {
  ActionChecklistPage,
  ExtensionPage,
  LogsPage,
  MeetingCalendarPage,
  MeetingDashboardPage,
  MeetingDetailPage,
  MeetingSettingsPage,
  MeetingsListPage,
  ParticipantsPage,
  ReleasesPage,
  TranscriptsPage,
} from '@exyconn/meetings-ui';
import { AiOverviewPage, AiPage, PromptLibraryPage } from './pages/ai';

/** Where the Meeting Assistant lives in this app; it covers the whole company here. */
const MEETINGS = { scope: 'ALL', basePath: '/ai/meeting-assistant' } as const;

/** AI micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.AI} homePath="/ai">
      <Route path="/ai" element={<AiOverviewPage />} />
      <Route path="/ai/jobs" element={<AiPage />} />
      <Route path="/ai/prompts" element={<PromptLibraryPage />} />
      <Route path="/ai/meeting-assistant" element={<MeetingDashboardPage {...MEETINGS} />} />
      <Route path="/ai/meeting-assistant/meetings" element={<MeetingsListPage {...MEETINGS} />} />
      <Route
        path="/ai/meeting-assistant/calendar"
        element={<MeetingCalendarPage {...MEETINGS} />}
      />
      <Route
        path="/ai/meeting-assistant/meetings/:id/:tab?"
        element={<MeetingDetailPage {...MEETINGS} />}
      />
      <Route path="/ai/meeting-assistant/transcripts" element={<TranscriptsPage {...MEETINGS} />} />
      <Route
        path="/ai/meeting-assistant/notes"
        element={<MeetingsListPage {...MEETINGS} notesOnly />}
      />
      <Route path="/ai/meeting-assistant/actions" element={<ActionChecklistPage {...MEETINGS} />} />
      <Route
        path="/ai/meeting-assistant/participants"
        element={<ParticipantsPage {...MEETINGS} />}
      />
      <Route path="/ai/meeting-assistant/extension" element={<ExtensionPage />} />
      <Route path="/ai/meeting-assistant/settings" element={<MeetingSettingsPage />} />
      <Route path="/ai/meeting-assistant/logs" element={<LogsPage {...MEETINGS} />} />
      <Route
        path="/ai/meeting-assistant/releases"
        element={
          <ProtectedRoute requiredRole={ROLES.ADMIN}>
            <ReleasesPage />
          </ProtectedRoute>
        }
      />
    </PortalApp>
  );
}
