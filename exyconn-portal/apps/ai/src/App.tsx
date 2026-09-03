import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AiOverviewPage, AiPage, PromptLibraryPage } from './pages/ai';

/** AI micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.AI} homePath="/ai">
      <Route path="/ai" element={<AiOverviewPage />} />
      <Route path="/ai/jobs" element={<AiPage />} />
      <Route path="/ai/prompts" element={<PromptLibraryPage />} />
    </PortalApp>
  );
}
