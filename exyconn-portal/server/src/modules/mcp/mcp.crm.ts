import type { ApolloServerPlugin } from '@apollo/server';
import type { DocumentNode, GraphQLSchema } from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { crmTypeDefs } from '../crm/crm.typeDefs';
import { crmEntitiesTypeDefs } from '../crm/crm.entities.typeDefs';
import { crmProfileTypeDefs } from '../crm/crm.profile.typeDefs';
import { crmMediaTypeDefs } from '../crm/crm.media.typeDefs';
import { crmRecordMetaTypeDefs } from '../crm/crm.record-meta.typeDefs';
import { crmGeoTypeDefs } from '../crm/crm.geo.typeDefs';
import { crmTimelineTypeDefs } from '../crm/timeline';
import { crmRecordsTypeDefs } from '../crm/records';
import { meetingTypeDefs } from '../crm/meetings/meeting.typeDefs';
import { crmCalendarTypeDefs } from '../crm/calendar/crm.calendar.typeDefs';
import { crmDashboardTypeDefs } from '../crm/dashboard/crm.dashboard.typeDefs';
import { coldEmailTypeDefs } from '../crm/cold-email/cold-email.typeDefs';
import { crmIntegrationsTypeDefs } from '../crm-integrations/crm-integrations.typeDefs';
import { crmMailTypeDefs } from '../crm-mail/crm-mail.typeDefs';
import { myMailboxesTypeDefs } from '../my-mailboxes/my-mailboxes.typeDefs';
import { gmailTypeDefs } from '../gmail/gmail.typeDefs';
import { microsoftMailTypeDefs } from '../microsoft-mail/microsoft.typeDefs';
import { emailVerificationTypeDefs } from '../email-verification/email-verification.typeDefs';
import { googleMapsTypeDefs } from '../google-maps/google-maps.typeDefs';
import { webScraperTypeDefs } from '../web-scraper/web-scraper.typeDefs';
import { crmTools, declaredFields, type DeclaredFields, type McpTool } from './mcp.tools';

/**
 * Everything the CRM portal does, as typeDefs: records (leads, companies, contacts, deals),
 * activities and the timeline, meetings and the calendar, the dashboard, mail and mailboxes,
 * cold emails, the lead generator (Google Maps), the email verifier and the website scraper.
 *
 * A CRM feature added to one of these is a tool the next time the server starts. A NEW CRM
 * module adds its typeDefs here — see docs/portal/crm/mcp-server.md.
 */
export const CRM_TYPE_DEFS: readonly DocumentNode[] = [
  crmTypeDefs,
  crmEntitiesTypeDefs,
  crmProfileTypeDefs,
  crmMediaTypeDefs,
  crmRecordMetaTypeDefs,
  crmGeoTypeDefs,
  crmTimelineTypeDefs,
  crmRecordsTypeDefs,
  meetingTypeDefs,
  crmCalendarTypeDefs,
  crmDashboardTypeDefs,
  coldEmailTypeDefs,
  crmIntegrationsTypeDefs,
  crmMailTypeDefs,
  myMailboxesTypeDefs,
  gmailTypeDefs,
  microsoftMailTypeDefs,
  emailVerificationTypeDefs,
  googleMapsTypeDefs,
  webScraperTypeDefs,
];

let schema: GraphQLSchema | null = null;
let tools: McpTool[] = [];

/** Keeps the schema Apollo builds, and the CRM tools made from it. */
export const mcpSchemaPlugin: ApolloServerPlugin<GraphQLContext> = {
  serverWillStart: (service) => {
    useSchema(service.schema);
    return Promise.resolve();
  },
};

/** Sets the schema tools run against (Apollo's at boot, offering the CRM's fields; a test's own). */
export function useSchema(
  next: GraphQLSchema,
  declared: DeclaredFields = declaredFields(CRM_TYPE_DEFS),
): void {
  schema = next;
  tools = crmTools(next, declared);
}

/** The live schema; throws before the server has started. */
export function liveSchema(): GraphQLSchema {
  if (!schema) {
    throw new Error('The GraphQL schema is not ready yet');
  }
  return schema;
}

/** Every CRM tool, by name order. */
export function mcpTools(): readonly McpTool[] {
  return tools;
}

/** One tool by name, or undefined. */
export function mcpTool(name: string): McpTool | undefined {
  return tools.find((tool) => tool.name === name);
}
