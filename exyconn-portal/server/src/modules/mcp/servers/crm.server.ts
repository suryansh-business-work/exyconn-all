import { crmTypeDefs } from '../../crm/crm.typeDefs';
import { crmEntitiesTypeDefs } from '../../crm/crm.entities.typeDefs';
import { crmProfileTypeDefs } from '../../crm/crm.profile.typeDefs';
import { crmMediaTypeDefs } from '../../crm/crm.media.typeDefs';
import { crmRecordMetaTypeDefs } from '../../crm/crm.record-meta.typeDefs';
import { crmGeoTypeDefs } from '../../crm/crm.geo.typeDefs';
import { crmTimelineTypeDefs } from '../../crm/timeline';
import { crmRecordsTypeDefs } from '../../crm/records';
import { meetingTypeDefs } from '../../crm/meetings/meeting.typeDefs';
import { crmCalendarTypeDefs } from '../../crm/calendar/crm.calendar.typeDefs';
import { crmDashboardTypeDefs } from '../../crm/dashboard/crm.dashboard.typeDefs';
import { coldEmailTypeDefs } from '../../crm/cold-email/cold-email.typeDefs';
import { dealScoreTypeDefs } from '../../crm/deal-score/deal-score.typeDefs';
import { crmIntegrationsTypeDefs } from '../../crm-integrations/crm-integrations.typeDefs';
import { crmMailTypeDefs } from '../../crm-mail/crm-mail.typeDefs';
import { myMailboxesTypeDefs } from '../../my-mailboxes/my-mailboxes.typeDefs';
import { gmailTypeDefs } from '../../gmail/gmail.typeDefs';
import { microsoftMailTypeDefs } from '../../microsoft-mail/microsoft.typeDefs';
import { mailHealthTypeDefs } from '../../mail-health/mail-health.typeDefs';
import { emailVerificationTypeDefs } from '../../email-verification/email-verification.typeDefs';
import { googleMapsTypeDefs } from '../../google-maps/google-maps.typeDefs';
import { webScraperTypeDefs } from '../../web-scraper/web-scraper.typeDefs';
import { clutchTypeDefs } from '../../lead-sources';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * The CRM as an MCP server: records (leads, companies, contacts, deals), activities and the
 * timeline, meetings and the calendar, the dashboard, mail and mailboxes (with their domains' health), cold emails, the lead
 * generators (Google Business and Clutch), the email verifier and the website scraper.
 *
 * A CRM feature added to one of these typeDefs is a tool the next time the server starts. A NEW
 * CRM module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const CRM_MCP: McpServerSpec = {
  key: 'crm',
  name: 'exyconn-crm',
  label: 'CRM',
  role: ROLES.CRM,
  auditModule: 'CRM (Claude MCP)',
  instructions:
    'Exyconn CRM: leads, companies, contacts, deals (with a 0-100 deal score and its reasons), activities (meeting notes are added to matching contacts and their open deals automatically), meetings, mail, cold emails, the lead generators (Google Business and Clutch.co search with reviews and portfolio), the email verifier and the website scraper. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting or sending anything.',
  typeDefs: [
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
    dealScoreTypeDefs,
    crmIntegrationsTypeDefs,
    crmMailTypeDefs,
    myMailboxesTypeDefs,
    gmailTypeDefs,
    microsoftMailTypeDefs,
    mailHealthTypeDefs,
    emailVerificationTypeDefs,
    googleMapsTypeDefs,
    webScraperTypeDefs,
    clutchTypeDefs,
  ],
};
