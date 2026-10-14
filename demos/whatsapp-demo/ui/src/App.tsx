import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { ChatsPage } from './pages/chats';
import { AdminPage } from './admin';
import { DemoLoginPage, VisitorGate } from '@exyconn/demo-visitor';
import { HOME_PATH } from './paths';
import { ADMIN_BASE } from './admin/admin.paths';

/** A visitor has the chats; the admin area is staff's. */
const isVisitorPath = (path: string) => !path.startsWith(ADMIN_BASE);

/**
 * The WhatsApp Business automation demo — for sales walking clients through it, and for
 * prospects trying it themselves.
 *
 * The chats open for any employee signed in to the portal, or for a demo visitor signed in
 * with an emailed one-time code (the sign-in screen here is email-and-code only). They render
 * without the portal's chrome (`chrome={false}`): the screen is WhatsApp and nothing else.
 * `/admin` (analytics, session logs and the bot-workflow editor) stays behind the portal's
 * own sign-in and ADMIN, checked here and, authoritatively, on the server.
 */
export function App() {
  return (
    <PortalApp
      loginElement={
        <DemoLoginPage
          title="Try the live WhatsApp demo"
          subtitle="Sign in with your email and a one-time code to chat with every demo bot."
          homePath={HOME_PATH}
          isVisitorPath={isVisitorPath}
        />
      }
      moduleRole={ROLES.EMPLOYEE}
      homePath={HOME_PATH}
      chrome={false}
      publicRoutes={
        <Route
          path="/:demoKey?"
          element={
            <PageErrorBoundary>
              <VisitorGate>
                <ChatsPage />
              </VisitorGate>
            </PageErrorBoundary>
          }
        />
      }
    >
      <Route
        path="/admin/*"
        element={
          <PageErrorBoundary>
            <AdminPage />
          </PageErrorBoundary>
        }
      />
    </PortalApp>
  );
}
