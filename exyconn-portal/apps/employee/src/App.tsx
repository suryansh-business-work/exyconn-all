import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import {
  MyLeavePage,
  MyAttendancePage,
  PayrollPage,
  SalarySlipsPage,
  HolidaysPage,
  PoliciesPage,
  SupportPage,
  CalendarPage,
  MyTrackerPage,
  DashboardPage,
  AnnouncementsPage,
  NotificationsPage,
  RequestsPage,
  GoalsPage,
  PerformancePage,
  ExpensesPage,
  BenefitsPage,
  TrainingPage,
  DocumentsPage,
} from './pages/employee';

/** My Workspace micro-frontend. Everything outside its routes comes from the shell. */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.EMPLOYEE} homePath="/me">
      <Route path="/me" element={<DashboardPage />} />
      <Route path="/me/payroll" element={<PayrollPage />} />
      <Route path="/me/salary-slips" element={<SalarySlipsPage />} />
      <Route path="/me/leave" element={<MyLeavePage />} />
      <Route path="/me/attendance" element={<MyAttendancePage />} />
      <Route path="/me/announcements" element={<AnnouncementsPage />} />
      <Route path="/me/holidays" element={<HolidaysPage />} />
      <Route path="/me/calendar" element={<CalendarPage />} />
      <Route path="/me/policies" element={<PoliciesPage />} />
      <Route path="/me/support" element={<SupportPage />} />
      <Route path="/me/tracker" element={<MyTrackerPage />} />
      <Route path="/me/notifications" element={<NotificationsPage />} />
      <Route path="/me/requests" element={<RequestsPage />} />
      <Route path="/me/goals" element={<GoalsPage />} />
      <Route path="/me/performance" element={<PerformancePage />} />
      <Route path="/me/expenses" element={<ExpensesPage />} />
      <Route path="/me/benefits" element={<BenefitsPage />} />
      <Route path="/me/training" element={<TrainingPage />} />
      <Route path="/me/documents" element={<DocumentsPage />} />
    </PortalApp>
  );
}
