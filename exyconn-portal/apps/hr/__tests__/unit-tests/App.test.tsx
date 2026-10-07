import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Navigate } from 'react-router-dom';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { UserDetailsPage } from '@exyconn/shell/pages/UserDetails';
import { App } from '../../src/App';
import { HrDashboardPage, EmployeeFormPage } from '../../src/pages/hr';
import { AnnouncementsPage } from '../../src/pages/announcements';
import { ApplicantsPage } from '../../src/pages/applicants';
import { BenefitsPage } from '../../src/pages/benefits';
import { DocumentsPage } from '../../src/pages/documents';
import { EmploymentTypesPage } from '../../src/pages/employment-types';
import { ExitsPage } from '../../src/pages/exits';
import { GoalsPage } from '../../src/pages/goals';
import { GradesPage } from '../../src/pages/grades';
import { HolidaysPage } from '../../src/pages/holidays';

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
  element: ReactElement<{ to?: string; replace?: boolean }>;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

const elementAt = (path: string) => routes().find((route) => route.path === path)?.element;

describe('App', () => {
  it('mounts the shell for the HR module, homed at /hr, signing in with Login', () => {
    render(<App />);

    expect(portal.props?.moduleRole).toBe(ROLES.HR);
    expect(portal.props?.homePath).toBe('/hr');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('registers every HR route once', () => {
    render(<App />);
    const paths = routes().map((route) => route.path);

    expect(paths).toHaveLength(38);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith('/hr'))).toBe(true);
  });

  it('puts each page on its route', () => {
    render(<App />);

    expect(elementAt('/hr')?.type).toBe(HrDashboardPage);
    expect(elementAt('/hr/employees/new')?.type).toBe(EmployeeFormPage);
    expect(elementAt('/hr/employees/:id/edit')?.type).toBe(EmployeeFormPage);
    expect(elementAt('/hr/employees/:id')?.type).toBe(UserDetailsPage);
    expect(elementAt('/hr/announcements')?.type).toBe(AnnouncementsPage);
    expect(elementAt('/hr/applicants')?.type).toBe(ApplicantsPage);
    expect(elementAt('/hr/benefits')?.type).toBe(BenefitsPage);
    expect(elementAt('/hr/documents')?.type).toBe(DocumentsPage);
    expect(elementAt('/hr/employment-types')?.type).toBe(EmploymentTypesPage);
    expect(elementAt('/hr/exits')?.type).toBe(ExitsPage);
    expect(elementAt('/hr/goals')?.type).toBe(GoalsPage);
    expect(elementAt('/hr/grades')?.type).toBe(GradesPage);
    expect(elementAt('/hr/holidays')?.type).toBe(HolidaysPage);
  });

  it('takes the tab slug on the reports and leave settings routes', () => {
    render(<App />);
    const paths = routes().map((route) => route.path);

    expect(paths).toContain('/hr/reports/:tab?');
    expect(paths).toContain('/hr/leave-settings/:tab?');
  });

  it('redirects the old links to where those screens live now, replacing history', () => {
    render(<App />);
    const redirects = {
      '/hr/leave-settings/holidays': '/hr/holidays',
      '/hr/leave-policies': '/hr/leave-settings/leave-types',
      '/hr/leave-balances': '/hr/employees',
      '/hr/positions': '/hr/departments',
    };

    for (const [from, to] of Object.entries(redirects)) {
      const element = elementAt(from);
      expect(element?.type).toBe(Navigate);
      expect(element?.props).toMatchObject({ to, replace: true });
    }
  });
});
