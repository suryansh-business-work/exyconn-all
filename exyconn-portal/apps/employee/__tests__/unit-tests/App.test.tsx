import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { NotificationsPage } from '@exyconn/shell/pages/Notifications';
import { ApprovalsPage } from '@exyconn/shell/pages/Approvals';
import { App } from '../../src/App';
import * as pages from '../../src/pages/employee';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as null | PortalProps }));

/** The real PortalApp builds an Apollo client and an AuthProvider; the stand-in records its props. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

interface RouteProps {
  path: string;
  element: ReactElement;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

const elementAt = (path: string) => routes().find((route) => route.path === path)?.element.type;

describe('App', () => {
  it('mounts the shell for the EMPLOYEE module, homed at /me, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.EMPLOYEE);
    expect(portal.props?.homePath).toBe('/me');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('registers every My Workspace route under /me', () => {
    render(<App />);
    expect(routes().map((route) => route.path)).toEqual([
      '/me',
      '/me/team',
      '/me/payroll',
      '/me/salary-slips',
      '/me/leave',
      '/me/attendance',
      '/me/announcements',
      '/me/holidays',
      '/me/calendar',
      '/me/policies',
      '/me/support',
      '/me/tracker',
      '/me/notifications',
      '/me/requests',
      '/me/approvals',
      '/me/goals',
      '/me/performance',
      '/me/expenses',
      '/me/benefits',
      '/me/training',
      '/me/onboarding',
      '/me/documents',
      '/me/exit',
    ]);
  });

  it('puts each page on its route', () => {
    render(<App />);
    expect(elementAt('/me')).toBe(pages.DashboardPage);
    expect(elementAt('/me/team')).toBe(pages.MyTeamPage);
    expect(elementAt('/me/payroll')).toBe(pages.PayrollPage);
    expect(elementAt('/me/salary-slips')).toBe(pages.SalarySlipsPage);
    expect(elementAt('/me/leave')).toBe(pages.MyLeavePage);
    expect(elementAt('/me/attendance')).toBe(pages.MyAttendancePage);
    expect(elementAt('/me/announcements')).toBe(pages.AnnouncementsPage);
    expect(elementAt('/me/holidays')).toBe(pages.HolidaysPage);
    expect(elementAt('/me/calendar')).toBe(pages.CalendarPage);
    expect(elementAt('/me/policies')).toBe(pages.PoliciesPage);
    expect(elementAt('/me/support')).toBe(pages.SupportPage);
    expect(elementAt('/me/tracker')).toBe(pages.MyTrackerPage);
    expect(elementAt('/me/notifications')).toBe(NotificationsPage);
    expect(elementAt('/me/requests')).toBe(pages.RequestsPage);
    expect(elementAt('/me/approvals')).toBe(ApprovalsPage);
    expect(elementAt('/me/goals')).toBe(pages.GoalsPage);
    expect(elementAt('/me/performance')).toBe(pages.PerformancePage);
    expect(elementAt('/me/expenses')).toBe(pages.ExpensesPage);
    expect(elementAt('/me/benefits')).toBe(pages.BenefitsPage);
    expect(elementAt('/me/training')).toBe(pages.TrainingPage);
    expect(elementAt('/me/onboarding')).toBe(pages.MyOnboardingPage);
    expect(elementAt('/me/documents')).toBe(pages.DocumentsPage);
    expect(elementAt('/me/exit')).toBe(pages.MyExitPage);
  });
});
