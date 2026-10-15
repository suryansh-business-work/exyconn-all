import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { DemoLoginPage, VisitorGate } from '@exyconn/demo-visitor';
import { WebsiteChatPage } from './pages/website-chat';

/** The demo page, at the root of the app (demos.exyconn.com/website-chat-demo); `/<demo key>` opens one site. */
const HOME_PATH = '/';
const SITE_PATH = '/:demoKey?';

/**
 * The AI website chat agent demo. Open to any employee signed in to the portal, or to a demo
 * visitor signed in with an emailed code — the same pass as the other demos, so one sign-in
 * opens all of them. No portal chrome.
 */
export function App() {
  return (
    <PortalApp
      loginElement={
        <DemoLoginPage
          title="Try the AI website chat agent"
          subtitle="Sign in with your email and a one-time code to chat with the demo websites."
          homePath={HOME_PATH}
        />
      }
      moduleRole={ROLES.EMPLOYEE}
      homePath={HOME_PATH}
      chrome={false}
      publicRoutes={
        <Route
          path={SITE_PATH}
          element={
            <PageErrorBoundary>
              <VisitorGate>
                <WebsiteChatPage />
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
