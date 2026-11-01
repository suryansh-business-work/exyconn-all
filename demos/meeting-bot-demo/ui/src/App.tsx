import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { DemoLoginPage, VisitorGate } from '@exyconn/demo-visitor';
import { MeetingBotPage } from './pages/meeting-bot';

/** The demo page, at the root of the app (demos.exyconn.com/meeting-bot-demo). */
const HOME_PATH = '/';

/**
 * The AI meeting bot demo. Open to any employee signed in to the portal, or to a demo visitor
 * signed in with an emailed code — the same pass as the other demos, so one sign-in opens all
 * of them. No portal chrome.
 */
export function App() {
  return (
    <PortalApp
      loginElement={
        <DemoLoginPage
          title="Try the AI meeting bot"
          subtitle="Sign in with your email and a one-time code to send the notetaker into your Google Meet call."
          homePath={HOME_PATH}
        />
      }
      moduleRole={ROLES.EMPLOYEE}
      homePath={HOME_PATH}
      chrome={false}
      publicRoutes={
        <Route
          path={HOME_PATH}
          element={
            <PageErrorBoundary>
              <VisitorGate>
                <MeetingBotPage />
              </VisitorGate>
            </PageErrorBoundary>
          }
        />
      }
    >
      {null}
    </PortalApp>
  );
}
