import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { ROLES, canAccess } from '@exyconn/shell/auth/roles';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { AdminForbidden } from './shell/AdminForbidden';
import { AdminShell } from './shell/AdminShell';

/**
 * `/admin/*`: analytics, session logs and the bot-workflow editor, for company administrators.
 *
 * `canAccess(…, ADMIN)` admits ADMIN only — SUPER_ADMIN is the platform above the companies
 * and is not given ADMIN implicitly — so the platform role is admitted by name. This check
 * only decides what to show; the server enforces the same roles on every admin query, and a
 * FORBIDDEN answer there lands on the same refusal screen.
 */
export function AdminPage() {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingState />;
  }
  const allowed =
    user !== null && (canAccess(user.roles, ROLES.ADMIN) || user.roles.includes(ROLES.SUPER_ADMIN));
  if (!allowed) {
    return <AdminForbidden />;
  }
  return <AdminShell user={user} />;
}
