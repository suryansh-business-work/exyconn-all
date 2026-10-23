import { Outlet } from 'react-router-dom';

/**
 * The CRM's pages. The communication windows float over them in the shell's dock, which the
 * portal layout mounts once for every portal.
 */
export function CommsDockLayout() {
  return <Outlet />;
}
