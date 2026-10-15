import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ProjectsPage, ProjectWorkspacePage } from './pages/projects';
import { ProjectsOverviewPage } from './pages/overview';
import { BugsPage } from './pages/bugs';
import { TicketPage } from './pages/browse';
import { WorkflowEditorPage, WorkflowsPage } from './pages/workflows';

/** Projects micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.PROJECTS} homePath="/projects">
      <Route path="/projects" element={<ProjectsOverviewPage />} />
      <Route path="/projects/list" element={<ProjectsPage />} />
      {/* One ticket as a page of its own, addressed by its key: /projects/browse/EXY-14. */}
      <Route path="/projects/browse/:key" element={<TicketPage />} />
      <Route path="/projects/workflows" element={<WorkflowsPage />} />
      <Route path="/projects/workflows/:id" element={<WorkflowEditorPage />} />
      {/* The tab slug (and, for the docs tab, the open page) live in the URL. */}
      <Route path="/projects/:id/:tab?/:pageId?" element={<ProjectWorkspacePage />} />
      <Route path="/bugs" element={<BugsPage />} />
    </PortalApp>
  );
}
