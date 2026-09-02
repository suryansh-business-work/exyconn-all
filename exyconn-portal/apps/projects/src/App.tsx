import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { ProjectsPage, ProjectBoardPage } from './pages/projects';
import { BugsPage } from './pages/bugs';

/** Projects micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.PROJECTS} homePath="/projects">
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id/board" element={<ProjectBoardPage />} />
      <Route path="/bugs" element={<BugsPage />} />
    </PortalApp>
  );
}
