import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { FeedPage } from './pages/feed';
import { PostPage } from './pages/post';
import { ProfilePage } from './pages/profile';

/**
 * The internal social micro-frontend. Everything outside its routes comes from the shell.
 *
 * Gated on EMPLOYEE rather than a role of its own: every colleague has that role, which
 * is the point — a company feed only part of the company can open is a noticeboard.
 */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.EMPLOYEE} homePath="/social">
      <Route path="/social" element={<FeedPage />} />
      <Route path="/social/posts/:id" element={<PostPage />} />
      <Route path="/social/me" element={<ProfilePage />} />
      <Route path="/social/people/:userId" element={<ProfilePage />} />
    </PortalApp>
  );
}
