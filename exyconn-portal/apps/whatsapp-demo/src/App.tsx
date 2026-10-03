import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { PageErrorBoundary } from '@exyconn/shell/logging/PageErrorBoundary';
import { Login } from '@exyconn/login';
import { ChatsPage } from './pages/chats';
import { AdminPage } from './admin';
import { HOME_PATH } from './paths';

/**
 * The WhatsApp Business automation demo sales walks clients through.
 *
 * Keyed to EMPLOYEE like Social — anyone in the company may run a demo — and rendered
 * without the portal's chrome (`chrome={false}`): once signed in, the screen is WhatsApp and
 * nothing else, with a way back to the portal in the chat list's menu. `/admin` (analytics,
 * session logs and the bot-workflow editor) checks for ADMIN here and, authoritatively, on
 * the server.
 */
export function App() {
  return (
    <PortalApp
      loginElement={<Login />}
      moduleRole={ROLES.EMPLOYEE}
      homePath={HOME_PATH}
      chrome={false}
    >
      <Route
        path="/whatsapp-demo/:demoKey?"
        element={
          <PageErrorBoundary>
            <ChatsPage />
          </PageErrorBoundary>
        }
      />
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
