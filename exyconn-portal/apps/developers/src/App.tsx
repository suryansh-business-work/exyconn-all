import { Navigate, Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ApiKeysPage } from './pages/api-keys/ApiKeysPage';
import { WebhooksPage } from './pages/webhooks/WebhooksPage';
import { DeliveriesPage } from './pages/deliveries/DeliveriesPage';
import { EventCataloguePage } from './pages/events/EventCataloguePage';
import { ApiReferencePage } from './pages/reference/ApiReferencePage';
import { McpPage } from './pages/mcp/McpPage';

/**
 * Developers micro-frontend (developers.exyconn.com): API keys and their usage, webhooks and
 * their delivery log, the event catalogue, the API reference and connecting Claude. An
 * administrator's, like the keys it manages. Everything outside its routes comes from the shell.
 */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.ADMIN} homePath="/developers">
      <Route path="/developers" element={<Navigate to="/developers/api-keys" replace />} />
      <Route path="/developers/api-keys" element={<ApiKeysPage />} />
      <Route path="/developers/webhooks" element={<WebhooksPage />} />
      <Route path="/developers/deliveries" element={<DeliveriesPage />} />
      <Route path="/developers/events" element={<EventCataloguePage />} />
      <Route path="/developers/reference" element={<ApiReferencePage />} />
      <Route path="/developers/mcp" element={<McpPage />} />
    </PortalApp>
  );
}
