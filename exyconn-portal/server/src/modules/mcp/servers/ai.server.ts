import { aiTypeDefs } from '../../ai/ai.typeDefs';
import { maMeetingTypeDefs } from '../../meeting-assistant/ma.typeDefs';
import { maNotesTypeDefs } from '../../meeting-assistant/ma.notes.typeDefs';
import { maAdminTypeDefs } from '../../meeting-assistant/ma.admin.typeDefs';
import { maModelsTypeDefs } from '../../meeting-assistant/ma.models.typeDefs';
import { maReleaseTypeDefs } from '../../meeting-assistant/ma.release.typeDefs';
import { maCalendarTypeDefs } from '../../meeting-assistant/ma.calendar.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * AI as an MCP server: the AI workspace and the meeting assistant (meetings, notes, models,
 * releases and the calendar).
 *
 * An AI feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW AI module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const AI_MCP: McpServerSpec = {
  key: 'ai',
  name: 'exyconn-ai',
  label: 'AI',
  role: ROLES.AI,
  auditModule: 'AI (Claude MCP)',
  instructions:
    'Exyconn AI: the AI workspace and the meeting assistant — meetings, notes, models, releases and the calendar. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting anything.',
  typeDefs: [
    aiTypeDefs,
    maMeetingTypeDefs,
    maNotesTypeDefs,
    maAdminTypeDefs,
    maModelsTypeDefs,
    maReleaseTypeDefs,
    maCalendarTypeDefs,
  ],
};
