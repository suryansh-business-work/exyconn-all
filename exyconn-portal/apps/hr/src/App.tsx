import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import {
  HrPage,
  HrDashboardPage,
  EmployeeRecordsPage,
  AttendanceListPage,
  DepartmentsPage,
  PositionsPage,
} from './pages/hr';
import { UserDetailsPage } from '@exyconn/shell/pages/UserDetails';
import { AnnouncementsPage } from './pages/announcements';

/** HR micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.HR} homePath="/hr">
      <Route path="/hr" element={<HrDashboardPage />} />
      <Route path="/hr/employees" element={<EmployeeRecordsPage />} />
      <Route path="/hr/employees/:id" element={<UserDetailsPage />} />
      <Route path="/hr/leave" element={<HrPage />} />
      <Route path="/hr/attendance" element={<AttendanceListPage />} />
      <Route path="/hr/departments" element={<DepartmentsPage />} />
      <Route path="/hr/announcements" element={<AnnouncementsPage />} />
      <Route path="/hr/positions" element={<PositionsPage />} />
    </PortalApp>
  );
}
