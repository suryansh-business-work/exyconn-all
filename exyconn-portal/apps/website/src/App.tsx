import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import {
  WebsiteSubmissionsPage,
  BlogPage,
  CaseStudiesPage,
  JobCompaniesPage,
  JobsPage,
  GigsPage,
  ToolCategoriesPage,
  ToolsPage,
  NavLinksPage,
} from './pages/website';

/** Website micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.WEBSITE} homePath="/website">
      <Route path="/website" element={<WebsiteSubmissionsPage />} />
      <Route path="/website/blog" element={<BlogPage />} />
      <Route path="/website/case-studies" element={<CaseStudiesPage />} />
      <Route path="/website/companies" element={<JobCompaniesPage />} />
      <Route path="/website/jobs" element={<JobsPage />} />
      <Route path="/website/gigs" element={<GigsPage />} />
      <Route path="/website/tool-categories" element={<ToolCategoriesPage />} />
      <Route path="/website/tools" element={<ToolsPage />} />
      <Route path="/website/nav-links" element={<NavLinksPage />} />
    </PortalApp>
  );
}
