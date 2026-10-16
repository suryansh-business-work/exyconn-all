import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
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
import { GmailAccountsPage } from '../../src/pages/settings/gmail';
import { PropertiesPage } from '../../src/pages/settings';
import { MeetingsPage } from '../../src/pages/meetings';

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

/** Each route the app declares, as path -> the page component it renders. */
function declaredRoutes(children: ReactNode) {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((route) => {
      const { path, element } = route.props as { path: string; element: ReactElement };
      return [path, element.type] as const;
    });
}

describe('App', () => {
  it('mounts the CRM module behind the CRM role, with the shared sign-in', () => {
    render(<App />);
    const props = portal.props as PortalProps;

    expect(props.moduleRole).toBe(ROLES.CRM);
    expect(props.homePath).toBe('/crm');
    expect(props.loginElement.type).toBe(Login);
  });

  it('routes every CRM screen to its page', () => {
    render(<App />);

    expect(declaredRoutes((portal.props as PortalProps).children)).toEqual([
      ['/crm', CrmOverviewPage],
      ['/crm/leads', CrmPage],
      ['/crm/companies', CompaniesPage],
      ['/crm/companies/:id/:tab?', CompanyDetailPage],
      ['/crm/contacts', ContactsPage],
      ['/crm/contacts/:id/:tab?', ContactDetailPage],
      ['/crm/deals', DealsPage],
      ['/crm/deals/list', DealsListPage],
      ['/crm/activities', ActivitiesPage],
      ['/crm/meetings/:tab?', MeetingsPage],
      ['/crm/tools/email-verifier/:tab?', EmailVerifierPage],
      ['/crm/tools/lead-generator', LeadGeneratorPage],
      ['/crm/settings/properties/:object?', PropertiesPage],
      ['/crm/settings/gmail', GmailAccountsPage],
    ]);
  });
});
