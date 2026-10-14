import type { SvgIconComponent } from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import { PORTAL_APPS, appBaseUrl, type PortalAppKey } from '@exyconn/shell/config/apps';

/** One demo as the landing page lists it: its words come from the app registry. */
export interface DemoEntry {
  key: PortalAppKey;
  title: string;
  description: string;
  url: string;
  icon: SvgIconComponent;
}

/** The mark each demo wears on its card; a demo without one is not listed. */
const DEMO_ICONS: Partial<Record<PortalAppKey, SvgIconComponent>> = {
  'whatsapp-demo': WhatsAppIcon,
  'calling-bot-demo': PhoneInTalkIcon,
};

/** "WhatsApp Demo · Exyconn" -> "WhatsApp Demo": the registry title without the brand suffix. */
const shortTitle = (title: string): string => title.split('·')[0].trim();

/**
 * Every demo served from demos.exyconn.com, in registry order: an app that shares the demos
 * origin under its own base path. Adding a demo to apps.json (and an icon above) lists it here.
 */
export const DEMOS: DemoEntry[] = (Object.keys(PORTAL_APPS) as PortalAppKey[]).flatMap((key) => {
  const icon = DEMO_ICONS[key];
  if (!icon) {
    return [];
  }
  const { title, description } = PORTAL_APPS[key];
  return [{ key, title: shortTitle(title), description, url: appBaseUrl(key), icon }];
});
