import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { Login } from '@exyconn/login';
import { McpDashboardPage } from './pages/dashboard';
import { McpConnectPage } from './pages/connect';
import { McpServerPage } from './pages/server';

/**
 * MCP micro-frontend: Claude's connectors to Exyconn — one server per module and a global one
 * combining them. Open to everyone in the company; each server's pages need that module's role
 * (the server checks it). Everything outside its routes comes from the shell.
 */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.EMPLOYEE} homePath="/mcp">
      <Route path="/mcp" element={<McpDashboardPage />} />
      <Route path="/mcp/connect" element={<McpConnectPage />} />
      <Route path="/mcp/crm/:tab?" element={<McpServerPage endpoint={McpEndpoint.Crm} />} />
      <Route
        path="/mcp/marketing/:tab?"
        element={<McpServerPage endpoint={McpEndpoint.Marketing} />}
      />
      <Route path="/mcp/all/:tab?" element={<McpServerPage endpoint={McpEndpoint.All} />} />
    </PortalApp>
  );
}
