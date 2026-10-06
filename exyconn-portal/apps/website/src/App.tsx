import { Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
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
  WhatsappLeadsPage,
} from './pages/website';
import { WebsiteOverviewPage } from './pages/overview';
import { BlogLiveEditRoute, CaseStudyLiveEditRoute } from './pages/website/live-edit';
import {
  ChatConversationPage,
  ChatFaqsPage,
  ChatKnowledgePage,
  ChatLayout,
  ChatSessionsPage,
  ChatSettingsPage,
} from './pages/chat';
import { SITE_BASE, SiteLayout, SiteRedirect } from './pages/cms/site';
import { WebsitesPage } from './pages/cms/websites';
import { PagesPage } from './pages/cms/pages';
import { FragmentsPage } from './pages/cms/fragments';
import { DesignSystemPage } from './pages/cms/design-system';
import { MediaPage } from './pages/cms/media';
import { SiteSettingsPage } from './pages/cms/settings';
import { NewsletterIssuesPage, NewsletterSubscribersPage } from './pages/cms/newsletter';
import { FragmentBuilderRoute, PageBuilderRoute } from './pages/cms/builder';

/**
 * Website micro-frontend. Everything outside its routes comes from the shell.
 *
 * Site pages live under /website/s/:siteSlug/…; any other /website/… address that is not a
 * page of its own (the sidebar's site-less links, old bookmarks such as /website/blog) is
 * sent to the same page of the last-used or default site by SiteRedirect.
 */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.WEBSITE} homePath="/website">
      <Route path="/website" element={<SiteRedirect />} />
      <Route path="/website/*" element={<SiteRedirect />} />
      <Route path="/website/sites" element={<WebsitesPage />} />
      <Route path="/website/submissions" element={<WebsiteSubmissionsPage />} />
      <Route path="/website/whatsapp-leads" element={<WhatsappLeadsPage />} />
      <Route path="/website/tool-categories" element={<ToolCategoriesPage />} />
      <Route path="/website/tools" element={<ToolsPage />} />
      <Route path={`${SITE_BASE}/:siteSlug`} element={<SiteLayout />}>
        <Route index element={<WebsiteOverviewPage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="pages/:id/edit" element={<PageBuilderRoute />} />
        <Route path="fragments" element={<FragmentsPage />} />
        <Route path="fragments/:id/edit" element={<FragmentBuilderRoute />} />
        <Route path="design-system/:tab?" element={<DesignSystemPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="nav-links" element={<NavLinksPage />} />
        <Route path="settings" element={<SiteSettingsPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:id/live-edit" element={<BlogLiveEditRoute />} />
        <Route path="case-studies" element={<CaseStudiesPage />} />
        <Route path="case-studies/:id/live-edit" element={<CaseStudyLiveEditRoute />} />
        <Route path="newsletter/issues" element={<NewsletterIssuesPage />} />
        <Route path="newsletter/subscribers" element={<NewsletterSubscribersPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="companies" element={<JobCompaniesPage />} />
        <Route path="gigs" element={<GigsPage />} />
      </Route>
      {/* One chat socket per tab, shared by every Chatbot screen. */}
      <Route element={<ChatLayout />}>
        <Route path="/website/chat/sessions" element={<ChatSessionsPage />} />
        <Route path="/website/chat/sessions/:id/*" element={<ChatConversationPage />} />
        <Route path="/website/chat/knowledge" element={<ChatKnowledgePage />} />
        <Route path="/website/chat/faqs" element={<ChatFaqsPage />} />
        <Route path="/website/chat/settings" element={<ChatSettingsPage />} />
      </Route>
    </PortalApp>
  );
}
