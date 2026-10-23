import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Navigate } from 'react-router-dom';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import { CrmOverviewPage, CrmPage } from '../../src/pages/crm';
import { CompaniesPage } from '../../src/pages/companies';
import { CompanyDetailPage } from '../../src/pages/companies/detail';
import { ContactsPage } from '../../src/pages/contacts';
import { ContactDetailPage } from '../../src/pages/contacts/detail';
import { DealsListPage, DealsPage } from '../../src/pages/deals';
import { ActivitiesPage } from '../../src/pages/activities';
import { EmailVerifierPage } from '../../src/pages/email-verifier';
import { LeadGeneratorPage } from '../../src/pages/lead-generator';
import { WebsiteScraperPage } from '../../src/pages/website-scraper';
import { PropertiesPage } from '../../src/pages/settings';
import { MeetingsPage } from '../../src/pages/meetings';
import { CalendarPage } from '../../src/pages/calendar';
import { IntegrationsPage } from '../../src/pages/integrations';
import { CommsDockLayout } from '../../src/records/comms';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as unknown }));

/** The shell's PortalApp owns routing and auth; the stand-in records what CRM hands it. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

vi.mock('@exyconn/login', () => ({ Login: () => null }));

interface RouteProps {
  path?: string;
  element: ReactElement;
  children?: ReactNode;
}

/** The pathless layout route the CRM pages sit in (it hosts the communication dock). */
function layoutRoute(children: ReactNode) {
  const layout = Children.toArray(children).find(isValidElement);
  return layout?.props as RouteProps;
}

/** Each route the layout declares, as path -> the page component it renders. */
function declaredRoutes(children: ReactNode) {
  return Children.toArray(layoutRoute(children).children)
    .filter(isValidElement)
    .map((route) => {
      const { path, element } = route.props as RouteProps;
      return [path, element.type] as const;
    });
}

/** The props of the route declared at `path` inside the communication-dock layout. */
const declaredRoute = (path: string) =>
  Children.toArray(layoutRoute((portal.props as PortalProps).children).children)
    .filter(isValidElement)
    .map((route) => route.props as RouteProps)
    .find((route) => route.path === path);

describe('App', () => {
  it('mounts the CRM module behind the CRM role, with the shared sign-in', () => {
    render(<App />);
    const props = portal.props as PortalProps;

    expect(props.moduleRole).toBe(ROLES.CRM);
    expect(props.homePath).toBe('/');
    expect(props.loginElement.type).toBe(Login);
  });

  it('routes every CRM screen to its page, inside the communication dock layout', () => {
    render(<App />);

    const layout = layoutRoute((portal.props as PortalProps).children);
    expect(layout.path).toBeUndefined();
    expect(layout.element.type).toBe(CommsDockLayout);
    expect(declaredRoutes((portal.props as PortalProps).children)).toEqual([
      ['/', CrmOverviewPage],
      ['/leads', CrmPage],
      ['/companies', CompaniesPage],
      ['/companies/:id/:tab?', CompanyDetailPage],
      ['/contacts', ContactsPage],
      ['/contacts/:id/:tab?', ContactDetailPage],
      ['/deals', DealsPage],
      ['/deals/list', DealsListPage],
      ['/activities', ActivitiesPage],
      ['/calendar', CalendarPage],
      ['/meetings/:tab?', MeetingsPage],
      ['/cold-emails/*', Navigate],
      ['/tools/email-verifier/:tab?', EmailVerifierPage],
      ['/tools/lead-generator', LeadGeneratorPage],
      ['/tools/website-scraper', WebsiteScraperPage],
      ['/settings/properties/:object?', PropertiesPage],
      ['/settings/gmail', Navigate],
      ['/integrations/:tab?', IntegrationsPage],
    ]);
  });

  it('sends the old Connect Gmail page to Integrations > Email', () => {
    render(<App />);

    const old = declaredRoute('/settings/gmail');
    expect(old?.element.props).toEqual({ to: '/integrations/email', replace: true });
  });

  it('sends old Cold emails links to Contacts, where each record has its own tab', () => {
    render(<App />);

    const old = declaredRoute('/cold-emails/*');
    expect(old?.element.props).toEqual({ to: '/contacts', replace: true });
  });
});
