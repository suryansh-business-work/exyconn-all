import { Outlet } from 'react-router-dom';
import { CommsDock } from './CommsDock';

/** The CRM's pages with the communication dock floating over them. */
export function CommsDockLayout() {
  return (
    <>
      <Outlet />
      <CommsDock />
    </>
  );
}
