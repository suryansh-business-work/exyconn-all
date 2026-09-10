import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import {
  SlaPoliciesPage,
  SupportConsolePage,
  SupportOverviewPage,
  TicketDetailPage,
} from './pages/support';
import { KnowledgeBasePage } from './pages/knowledge-base';
import { CannedRepliesPage } from './pages/canned-replies';

/** Support micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.SUPPORT} homePath="/support">
      <Route path="/support" element={<SupportOverviewPage />} />
      <Route path="/support/tickets" element={<SupportConsolePage />} />
      <Route path="/support/tickets/:id" element={<TicketDetailPage />} />
      <Route path="/support/sla" element={<SlaPoliciesPage />} />
      <Route path="/support/knowledge-base" element={<KnowledgeBasePage />} />
      <Route path="/support/canned-replies" element={<CannedRepliesPage />} />
    </PortalApp>
  );
}
