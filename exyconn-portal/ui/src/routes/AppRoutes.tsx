import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PortalLayout } from '../layout/PortalLayout';
import { ROLES } from '../auth/roles';
import { Login } from '../pages/Login/Login';
import { Portal } from '../pages/Portal/Portal';
import { ProfilePage } from '../pages/Profile';
import { SettingsPage } from '../pages/Settings';
import { AdminPage, UserDetailsPage } from '../pages/modules/admin';
import { FinancePage } from '../pages/modules/finance';
import { BugsPage } from '../pages/modules/bugs';
import { ClientsPage } from '../pages/modules/clients';
import { SupportConsolePage } from '../pages/modules/support';
import {
  HrPage,
  HrDashboardPage,
  EmployeeRecordsPage,
  AttendanceListPage,
  DepartmentsPage,
  PositionsPage,
} from '../pages/modules/hr';
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
} from '../pages/Employee';
import { MarketingPage } from '../pages/modules/marketing';
import {
  LegalDashboardPage,
  DocumentsPage,
  ContractsPage,
  SignBoardPage,
} from '../pages/modules/legal';
import { AiPage, PromptLibraryPage } from '../pages/modules/ai';
import { CrmPage } from '../pages/modules/crm';
import { ProductsPage } from '../pages/modules/products';
import { ProjectsPage, ProjectBoardPage } from '../pages/modules/projects';
import { TechPage } from '../pages/modules/tech';
import {
  TrackerPage,
  TrackerAccessPage,
  TrackerDevicesPage,
  TrackerSettingsPage,
} from '../pages/modules/tracker';
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
} from '../pages/modules/website';

/** Top-level route tree. Module routes are gated by role inside PortalLayout. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Portal />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users/:id"
          element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance"
          element={
            <ProtectedRoute requiredRole={ROLES.FINANCE}>
              <FinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="bugs"
          element={
            <ProtectedRoute requiredRole={ROLES.PROJECTS}>
              <BugsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="clients"
          element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="support"
          element={
            <ProtectedRoute requiredRole={ROLES.SUPPORT}>
              <SupportConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/payroll"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <PayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/salary-slips"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <SalarySlipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/leave"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <MyLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/attendance"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <MyAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/holidays"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <HolidaysPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/calendar"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/policies"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <PoliciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/support"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <SupportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="me/tracker"
          element={
            <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
              <MyTrackerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hr"
          element={
            <ProtectedRoute requiredRole={ROLES.HR}>
              <HrDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hr/employees"
          element={
            <ProtectedRoute requiredRole={ROLES.HR}>
              <EmployeeRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hr/employees/:id"
          element={
            <ProtectedRoute requiredRole={ROLES.HR}>
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hr/leave"
          element={
            <ProtectedRoute requiredRole={ROLES.HR}>
              <HrPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hr/attendance"
          element={
            <ProtectedRoute requiredRole={ROLES.HR}>
              <AttendanceListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hr/departments"
          element={
            <ProtectedRoute requiredRole={ROLES.HR}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hr/positions"
          element={
            <ProtectedRoute requiredRole={ROLES.HR}>
              <PositionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="marketing"
          element={
            <ProtectedRoute requiredRole={ROLES.MARKETING}>
              <MarketingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="legal"
          element={
            <ProtectedRoute requiredRole={ROLES.LEGAL}>
              <LegalDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="legal/documents"
          element={
            <ProtectedRoute requiredRole={ROLES.LEGAL}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="legal/contracts"
          element={
            <ProtectedRoute requiredRole={ROLES.LEGAL}>
              <ContractsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="legal/sign"
          element={
            <ProtectedRoute requiredRole={ROLES.LEGAL}>
              <SignBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ai"
          element={
            <ProtectedRoute requiredRole={ROLES.AI}>
              <AiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ai/prompts"
          element={
            <ProtectedRoute requiredRole={ROLES.AI}>
              <PromptLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="crm"
          element={
            <ProtectedRoute requiredRole={ROLES.CRM}>
              <CrmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute requiredRole={ROLES.PRODUCTS}>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects"
          element={
            <ProtectedRoute requiredRole={ROLES.PROJECTS}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id/board"
          element={
            <ProtectedRoute requiredRole={ROLES.PROJECTS}>
              <ProjectBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="tech"
          element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <TechPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <WebsiteSubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/blog"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <BlogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/case-studies"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <CaseStudiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/companies"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <JobCompaniesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/jobs"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <JobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/gigs"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <GigsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/tool-categories"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <ToolCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/tools"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <ToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="website/nav-links"
          element={
            <ProtectedRoute requiredRole={ROLES.WEBSITE}>
              <NavLinksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="tracker"
          element={
            <ProtectedRoute requiredRole={ROLES.TRACKER}>
              <TrackerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="tracker/access"
          element={
            <ProtectedRoute requiredRole={ROLES.TRACKER}>
              <TrackerAccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="tracker/devices"
          element={
            <ProtectedRoute requiredRole={ROLES.TRACKER}>
              <TrackerDevicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="tracker/settings"
          element={
            <ProtectedRoute requiredRole={ROLES.TRACKER}>
              <TrackerSettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/portal" replace />} />
    </Routes>
  );
}
