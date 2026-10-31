import { PORTAL_APPS, appBaseUrl, type PortalAppKey } from '@exyconn/shell/config/apps';

/** One live demo, as the header and footer link it. */
export interface DemoLink {
  key: PortalAppKey;
  label: string;
  url: string;
}

/** The demos, in the order the site presents them; their names come from the app registry. */
const DEMO_KEYS: readonly PortalAppKey[] = [
  'calling-bot-demo',
  'whatsapp-demo',
  'website-chat-demo',
  'meeting-bot-demo',
  'mcp-sandbox-demo',
];

/** "WhatsApp Demo · Exyconn" -> "WhatsApp Demo": the registry title without the brand suffix. */
export const shortTitle = (title: string): string => title.split('·')[0].trim();

export const DEMO_LINKS: readonly DemoLink[] = DEMO_KEYS.map((key) => ({
  key,
  label: shortTitle(PORTAL_APPS[key].title),
  url: appBaseUrl(key),
}));

/** The landing page that lists every demo. */
export const ALL_DEMOS_URL = appBaseUrl('demos');
