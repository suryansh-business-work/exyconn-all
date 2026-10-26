import { marketingTypeDefs } from '../../marketing/marketing.typeDefs';
import { audienceTypeDefs } from '../../marketing/audience.typeDefs';
import { suppressionTypeDefs } from '../../marketing/suppression.typeDefs';
import { campaignStudioTypeDefs } from '../../marketing/campaign.studio.typeDefs';
import { marketingMetricsTypeDefs } from '../../marketing/marketing.metrics.typeDefs';
import { socialAccountsTypeDefs } from '../../social-accounts/social.typeDefs';
import { socialPostsTypeDefs } from '../../social-accounts/social.posts.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Marketing as an MCP server: campaigns and their sends, metrics and quality checks, audiences,
 * templates and the email studio, email preferences and the footer, the suppression list, and
 * social media (accounts, posts, the calendar and analytics).
 *
 * A Marketing feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Marketing module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const MARKETING_MCP: McpServerSpec = {
  key: 'marketing',
  name: 'exyconn-marketing',
  label: 'Marketing',
  role: ROLES.MARKETING,
  auditModule: 'Marketing (Claude MCP)',
  instructions:
    'Exyconn Marketing: email campaigns and their sends, campaign metrics, audiences, templates, email preferences, the suppression list and social media posts, accounts and analytics. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting, sending or publishing anything.',
  typeDefs: [
    marketingTypeDefs,
    audienceTypeDefs,
    suppressionTypeDefs,
    campaignStudioTypeDefs,
    marketingMetricsTypeDefs,
    socialAccountsTypeDefs,
    socialPostsTypeDefs,
  ],
};
