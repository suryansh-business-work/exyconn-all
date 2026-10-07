import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import * as website from '../../src/pages/website';
import * as liveEdit from '../../src/pages/website/live-edit';
import * as chat from '../../src/pages/chat';
import * as site from '../../src/pages/cms/site';
import { WebsiteOverviewPage } from '../../src/pages/overview';
import { WebsitesPage } from '../../src/pages/cms/websites';
import { PagesPage } from '../../src/pages/cms/pages';
import { FragmentsPage } from '../../src/pages/cms/fragments';
import { DesignSystemPage } from '../../src/pages/cms/design-system';
import { MediaPage } from '../../src/pages/cms/media';
import { SiteSettingsPage } from '../../src/pages/cms/settings';
import { NewsletterIssuesPage, NewsletterSubscribersPage } from '../../src/pages/cms/newsletter';
import { FragmentBuilderRoute, PageBuilderRoute } from '../../src/pages/cms/builder';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as unknown }));

/** Named stand-ins for the page modules: the routes only need each page's identity. */
const stubs = vi.hoisted(
  () => (names: string[]) =>
    Object.fromEntries(
      names.map((name) => [name, Object.assign(() => null, { displayName: name })]),
    ),
);

/** The shell's PortalApp owns routing and auth; the stand-in records what the app hands it. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));
vi.mock('@exyconn/login', () => ({ Login: () => null }));
vi.mock('../../src/pages/website', () =>
  stubs([
    'WebsiteSubmissionsPage',
    'BlogPage',
    'CaseStudiesPage',
    'JobCompaniesPage',
    'JobsPage',
    'GigsPage',
    'ToolCategoriesPage',
    'ToolsPage',
    'NavLinksPage',
    'WhatsappLeadsPage',
  ]),
);
vi.mock('../../src/pages/overview', () => stubs(['WebsiteOverviewPage']));
vi.mock('../../src/pages/website/live-edit', () =>
  stubs(['BlogLiveEditRoute', 'CaseStudyLiveEditRoute']),
);
vi.mock('../../src/pages/chat', () =>
  stubs([
    'ChatConversationPage',
    'ChatFaqsPage',
    'ChatKnowledgePage',
    'ChatLayout',
    'ChatSessionsPage',
    'ChatSettingsPage',
  ]),
);
vi.mock('../../src/pages/cms/site', () => ({
  ...stubs(['SiteLayout', 'SiteRedirect']),
  SITE_BASE: '/website/s',
}));
vi.mock('../../src/pages/cms/websites', () => stubs(['WebsitesPage']));
vi.mock('../../src/pages/cms/pages', () => stubs(['PagesPage']));
vi.mock('../../src/pages/cms/fragments', () => stubs(['FragmentsPage']));
vi.mock('../../src/pages/cms/design-system', () => stubs(['DesignSystemPage']));
vi.mock('../../src/pages/cms/media', () => stubs(['MediaPage']));
vi.mock('../../src/pages/cms/settings', () => stubs(['SiteSettingsPage']));
vi.mock('../../src/pages/cms/newsletter', () =>
  stubs(['NewsletterIssuesPage', 'NewsletterSubscribersPage']),
);
vi.mock('../../src/pages/cms/builder', () => stubs(['FragmentBuilderRoute', 'PageBuilderRoute']));

interface RouteProps {
  path?: string;
  index?: boolean;
  element: ReactElement;
  children?: ReactNode;
}

/** Each declared route as [path, page]; an index route is named "index", a layout route has no path. */
function routesOf(children: ReactNode) {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((route) => {
      const { path, index, element } = route.props as RouteProps;
      return [index ? 'index' : path, element.type] as const;
    });
}

/** The nested routes of the declared route at `position`. */
function childRoutesAt(position: number) {
  const routes = Children.toArray(renderedPortal().children).filter(isValidElement);
  return routesOf((routes[position].props as RouteProps).children);
}

function renderedPortal(): PortalProps {
  render(<App />);
  return portal.props as PortalProps;
}

describe('App', () => {
  it('mounts the Website module behind the Website role, with the shared sign-in', () => {
    const props = renderedPortal();

    expect(props.moduleRole).toBe(ROLES.WEBSITE);
    expect(props.homePath).toBe('/website');
    expect(props.loginElement.type).toBe(Login);
  });

  it('sends site-less addresses to the redirect and routes the cross-site pages', () => {
    expect(routesOf(renderedPortal().children)).toEqual([
      ['/website', site.SiteRedirect],
      ['/website/*', site.SiteRedirect],
      ['/website/sites', WebsitesPage],
      ['/website/submissions', website.WebsiteSubmissionsPage],
      ['/website/whatsapp-leads', website.WhatsappLeadsPage],
      ['/website/tool-categories', website.ToolCategoriesPage],
      ['/website/tools', website.ToolsPage],
      ['/website/s/:siteSlug', site.SiteLayout],
      [undefined, chat.ChatLayout],
    ]);
  });

  it('puts every page of one site under its slug, with the overview as the index', () => {
    expect(childRoutesAt(7)).toEqual([
      ['index', WebsiteOverviewPage],
      ['pages', PagesPage],
      ['pages/:id/edit', PageBuilderRoute],
      ['fragments', FragmentsPage],
      ['fragments/:id/edit', FragmentBuilderRoute],
      ['design-system/:tab?', DesignSystemPage],
      ['media', MediaPage],
      ['nav-links', website.NavLinksPage],
      ['settings', SiteSettingsPage],
      ['blog', website.BlogPage],
      ['blog/:id/live-edit', liveEdit.BlogLiveEditRoute],
      ['case-studies', website.CaseStudiesPage],
      ['case-studies/:id/live-edit', liveEdit.CaseStudyLiveEditRoute],
      ['newsletter/issues', NewsletterIssuesPage],
      ['newsletter/subscribers', NewsletterSubscribersPage],
      ['jobs', website.JobsPage],
      ['companies', website.JobCompaniesPage],
      ['gigs', website.GigsPage],
    ]);
  });

  it('shares one chat layout between every Chatbot screen', () => {
    expect(childRoutesAt(8)).toEqual([
      ['/website/chat/sessions', chat.ChatSessionsPage],
      ['/website/chat/sessions/:id/*', chat.ChatConversationPage],
      ['/website/chat/knowledge', chat.ChatKnowledgePage],
      ['/website/chat/faqs', chat.ChatFaqsPage],
      ['/website/chat/settings', chat.ChatSettingsPage],
    ]);
  });
});
