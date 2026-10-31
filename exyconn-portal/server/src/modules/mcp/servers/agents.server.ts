import { agentsTypeDefs } from '../../agents/agents.typeDefs';
import { callingBotTypeDefs } from '../../calling-bot-demo/calling-bot.typeDefs';
import { websiteChatTypeDefs } from '../../website-chat/chat.typeDefs';
import { websiteChatLibraryTypeDefs } from '../../website-chat/chat.library.typeDefs';
import { whatsappDemoTypeDefs } from '../../../../../../demos/whatsapp-demo/server/src/whatsappDemo.typeDefs';
import { whatsappDemoVisitorTypeDefs } from '../../../../../../demos/whatsapp-demo/server/src/visitor/visitor.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * The Agents console as an MCP server: its overview, the WhatsApp and website agents' bot studio
 * (demos, workflows, sessions and stats), the calling bot, the website chat with its knowledge
 * and FAQs, and the WhatsApp demo leads. Credentials stay out (see EXCLUDED in
 * core/mcp.tools.ts), and so does the WhatsApp channel, which holds the Meta access token.
 *
 * Tech and Website still declare the bots and the chat they ran before the console existed, so
 * connectors already pointed at them keep their tools; the global server offers each field once.
 * An Agents feature added to one of these typeDefs is a tool the next time the server starts.
 */
export const AGENTS_MCP: McpServerSpec = {
  key: 'agents',
  name: 'exyconn-agents',
  label: 'Agents',
  role: ROLES.AGENTS,
  auditModule: 'Agents (Claude MCP)',
  instructions:
    'Exyconn Agents: the AI agents console — its overview (conversations, calls, leads captured, deflection), the WhatsApp and website chat agents (demos, workflows, sessions and stats), the calling bot (examples, call flows and calls), the website chat with its knowledge base and FAQs, and the WhatsApp demo leads. Credentials are never offered. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before publishing a workflow, changing what the public demos say or deleting anything.',
  typeDefs: [
    agentsTypeDefs,
    whatsappDemoTypeDefs,
    callingBotTypeDefs,
    websiteChatTypeDefs,
    websiteChatLibraryTypeDefs,
    whatsappDemoVisitorTypeDefs,
  ],
};
