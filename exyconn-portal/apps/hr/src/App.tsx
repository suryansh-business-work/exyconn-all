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
import { ReportsPage } from './pages/reports';
import { SalariesPage } from './pages/salaries';
import { PayrollPage } from './pages/payroll';
import { LocationsPage } from './pages/locations';
import { TeamsPage } from './pages/teams';
import { GradesPage } from './pages/grades';
import { EmploymentTypesPage } from './pages/employment-types';
import { ShiftsPage } from './pages/shifts';
import { ExitsPage } from './pages/exits';
import { HolidaysPage } from './pages/holidays';
import { LeavePoliciesPage } from './pages/leave-policies';
import { LeaveBalancesPage } from './pages/leave-balances';
import { RequestsPage } from './pages/requests';
import { GoalsPage } from './pages/goals';
import { PerformancePage } from './pages/performance';
import { DocumentsPage } from './pages/documents';
import { BenefitsPage } from './pages/benefits';
import { TrainingPage } from './pages/training';

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
      <Route path="/hr/reports" element={<ReportsPage />} />
      <Route path="/hr/salaries" element={<SalariesPage />} />
      <Route path="/hr/payroll" element={<PayrollPage />} />
      <Route path="/hr/locations" element={<LocationsPage />} />
      <Route path="/hr/teams" element={<TeamsPage />} />
      <Route path="/hr/grades" element={<GradesPage />} />
      <Route path="/hr/employment-types" element={<EmploymentTypesPage />} />
      <Route path="/hr/shifts" element={<ShiftsPage />} />
      <Route path="/hr/exits" element={<ExitsPage />} />
      <Route path="/hr/holidays" element={<HolidaysPage />} />
      <Route path="/hr/leave-policies" element={<LeavePoliciesPage />} />
      <Route path="/hr/leave-balances" element={<LeaveBalancesPage />} />
      <Route path="/hr/requests" element={<RequestsPage />} />
      <Route path="/hr/goals" element={<GoalsPage />} />
      <Route path="/hr/performance" element={<PerformancePage />} />
      <Route path="/hr/documents" element={<DocumentsPage />} />
      <Route path="/hr/benefits" element={<BenefitsPage />} />
      <Route path="/hr/training" element={<TrainingPage />} />
      <Route path="/hr/positions" element={<PositionsPage />} />
    </PortalApp>
  );
}
