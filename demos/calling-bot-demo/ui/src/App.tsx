import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { DemoLoginPage, VisitorGate } from '@exyconn/demo-visitor';
import { CallPage } from './pages/CallPage';

/** The call screen, at the root of the app (demos.exyconn.com/calling-bot-demo). */
const HOME_PATH = '/';

/**
 * The AI calling bot demo. Open to any employee signed in to the portal, or to a demo visitor
 * signed in with an emailed code — the same pass as the WhatsApp demo, so one sign-in opens
 * both. No portal chrome: the screen is the call and nothing else.
 */
export function App() {
  return (
    <PortalApp
      loginElement={
        <DemoLoginPage
          title="Talk to our AI calling bot"
          subtitle="Sign in with your email and a one-time code to call the bot."
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
                <CallPage />
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
