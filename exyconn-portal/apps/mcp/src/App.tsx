import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { McpEndpoint } from '@exyconn/shell/graphql/generated';
import { Login } from '@exyconn/login';
import { McpDashboardPage } from './pages/dashboard';
import { McpConnectPage } from './pages/connect';
import { McpServerPage } from './pages/server';
import { McpSettingsPage } from './pages/settings';

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
      <Route path="/mcp/settings" element={<McpSettingsPage />} />
      <Route path="/mcp/crm/:tab?" element={<McpServerPage endpoint={McpEndpoint.Crm} />} />
      <Route
        path="/mcp/marketing/:tab?"
        element={<McpServerPage endpoint={McpEndpoint.Marketing} />}
      />
      <Route path="/mcp/admin/:tab?" element={<McpServerPage endpoint={McpEndpoint.Admin} />} />
      <Route path="/mcp/ai/:tab?" element={<McpServerPage endpoint={McpEndpoint.Ai} />} />
      <Route
        path="/mcp/clienthub/:tab?"
        element={<McpServerPage endpoint={McpEndpoint.Clienthub} />}
      />
      <Route
        path="/mcp/compliance/:tab?"
        element={<McpServerPage endpoint={McpEndpoint.Compliance} />}
      />
      <Route
        path="/mcp/employee/:tab?"
        element={<McpServerPage endpoint={McpEndpoint.Employee} />}
      />
      <Route path="/mcp/finance/:tab?" element={<McpServerPage endpoint={McpEndpoint.Finance} />} />
      <Route path="/mcp/hr/:tab?" element={<McpServerPage endpoint={McpEndpoint.Hr} />} />
      <Route path="/mcp/it/:tab?" element={<McpServerPage endpoint={McpEndpoint.It} />} />
      <Route path="/mcp/legal/:tab?" element={<McpServerPage endpoint={McpEndpoint.Legal} />} />
      <Route
        path="/mcp/products/:tab?"
        element={<McpServerPage endpoint={McpEndpoint.Products} />}
      />
      <Route
        path="/mcp/projects/:tab?"
        element={<McpServerPage endpoint={McpEndpoint.Projects} />}
      />
      <Route path="/mcp/social/:tab?" element={<McpServerPage endpoint={McpEndpoint.Social} />} />
      <Route path="/mcp/status/:tab?" element={<McpServerPage endpoint={McpEndpoint.Status} />} />
      <Route path="/mcp/support/:tab?" element={<McpServerPage endpoint={McpEndpoint.Support} />} />
      <Route path="/mcp/tech/:tab?" element={<McpServerPage endpoint={McpEndpoint.Tech} />} />
      <Route path="/mcp/tracker/:tab?" element={<McpServerPage endpoint={McpEndpoint.Tracker} />} />
      <Route path="/mcp/website/:tab?" element={<McpServerPage endpoint={McpEndpoint.Website} />} />
      <Route path="/mcp/all/:tab?" element={<McpServerPage endpoint={McpEndpoint.All} />} />
    </PortalApp>
  );
}
