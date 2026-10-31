import { Navigate, Route } from 'react-router-dom';
import { PortalApp } from '@exyconn/shell';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { AgentsOverviewPage } from './pages/overview';
import { CallingBotPage, WebsiteBotPage, WhatsappAgentPage } from './pages/bots';
import {
  ChatConversationPage,
  ChatFaqsPage,
  ChatKnowledgePage,
  ChatLayout,
  ChatSessionsPage,
  ChatSettingsPage,
} from './pages/chat';
import { WhatsappLeadsPage } from './pages/whatsapp-leads';

/**
 * Agents micro-frontend: the console for every AI agent — WhatsApp workflows, the calling bot,
 * the website chat agent with its knowledge, FAQs and live sessions, and the leads they bring
 * in. Everything outside its routes comes from the shell.
 */
export function App() {
  return (
    <PortalApp loginElement={<Login />} moduleRole={ROLES.AGENTS} homePath="/agents">
      <Route path="/agents" element={<AgentsOverviewPage />} />
      <Route path="/agents/whatsapp/*" element={<WhatsappAgentPage />} />
      <Route path="/agents/calling-bot/:tab?" element={<CallingBotPage />} />
      <Route path="/agents/website-bot/*" element={<WebsiteBotPage />} />
      <Route path="/agents/whatsapp-leads" element={<WhatsappLeadsPage />} />
      {/* One chat socket per tab, shared by every website chat screen. */}
      <Route element={<ChatLayout />}>
        <Route path="/agents/chat/sessions" element={<ChatSessionsPage />} />
        <Route path="/agents/chat/sessions/:id/*" element={<ChatConversationPage />} />
        <Route path="/agents/chat/knowledge" element={<ChatKnowledgePage />} />
        <Route path="/agents/chat/faqs" element={<ChatFaqsPage />} />
        <Route path="/agents/chat/settings" element={<ChatSettingsPage />} />
      </Route>
      <Route path="/agents/chat" element={<Navigate to="/agents/chat/sessions" replace />} />
    </PortalApp>
  );
}
