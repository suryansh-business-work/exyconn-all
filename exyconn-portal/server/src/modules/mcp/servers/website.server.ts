import { websiteTypeDefs } from '../../website/typeDefs';
import { cmsTypeDefs } from '../../cms/cms.typeDefs';
import { cmsContentTypeDefs } from '../../cms/cms.content.typeDefs';
import { cmsPublicTypeDefs } from '../../cms/cms.public.typeDefs';
import { websiteChatTypeDefs } from '../../website-chat/chat.typeDefs';
import { websiteChatLibraryTypeDefs } from '../../website-chat/chat.library.typeDefs';
import { gccTypeDefs } from '../../gcc/gcc.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * The website as an MCP server: its content entities, the CMS, the website chat agent and its
 * library, and the GCC cost calculator.
 *
 * A Website feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Website module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const WEBSITE_MCP: McpServerSpec = {
  key: 'website',
  name: 'exyconn-website',
  label: 'Website',
  role: ROLES.WEBSITE,
  auditModule: 'Website (Claude MCP)',
  instructions:
    'Exyconn Website: website content (pages, blog, careers, industries and more), the CMS, the website chat agent and its library, and the GCC cost calculator. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before publishing or deleting anything.',
  typeDefs: [
    ...websiteTypeDefs,
    cmsTypeDefs,
    cmsContentTypeDefs,
    cmsPublicTypeDefs,
    websiteChatTypeDefs,
    websiteChatLibraryTypeDefs,
    gccTypeDefs,
  ],
};
