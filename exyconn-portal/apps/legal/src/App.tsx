import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { LegalDashboardPage, DocumentsPage, ContractsPage, SignBoardPage } from './pages/legal';

/** Legal micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.LEGAL} homePath="/legal">
      <Route path="/legal" element={<LegalDashboardPage />} />
      <Route path="/legal/documents" element={<DocumentsPage />} />
      <Route path="/legal/contracts" element={<ContractsPage />} />
      <Route path="/legal/sign" element={<SignBoardPage />} />
    </PortalApp>
  );
}
