import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ComplianceOverviewPage } from './pages/overview';
import { RisksPage } from './pages/risks';
import { ObjectivesPage } from './pages/objectives';
import { AuditsPage } from './pages/audits';
import { FindingsPage } from './pages/findings';
import { ReviewsPage } from './pages/reviews';

/**
 * Compliance micro-frontend — one management system for ISO 9001, 27001, 45001 and 14001.
 *
 * The overview is the home screen: "are we ready for an audit" is the question both an
 * auditor and the person being audited open with, and it is not answerable from a register.
 */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.COMPLIANCE} homePath="/compliance">
      <Route path="/compliance" element={<ComplianceOverviewPage />} />
      <Route path="/compliance/risks" element={<RisksPage />} />
      <Route path="/compliance/objectives" element={<ObjectivesPage />} />
      <Route path="/compliance/audits" element={<AuditsPage />} />
      <Route path="/compliance/findings" element={<FindingsPage />} />
      <Route path="/compliance/reviews" element={<ReviewsPage />} />
    </PortalApp>
  );
}
