import type { SvgIconComponent } from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import { PORTAL_APPS, appBaseUrl, type PortalAppKey } from '@exyconn/shell/config/apps';
import { DEMO_PHOTOS, type DemoPhoto } from '@exyconn/demo-visitor/page';

/** One demo as the landing page lists it: its words come from the app registry. */
export interface DemoEntry {
  key: PortalAppKey;
  title: string;
  description: string;
  url: string;
  icon: SvgIconComponent;
  photo: DemoPhoto;
  /** What a visitor can try in it, one line each. */
  highlights: readonly string[];
}

type DemoLook = Pick<DemoEntry, 'icon' | 'photo' | 'highlights'>;

/** How each demo is shown on its card; a demo without an entry here is not listed. */
const DEMO_LOOKS: Partial<Record<PortalAppKey, DemoLook>> = {
  'calling-bot-demo': {
    icon: PhoneInTalkIcon,
    photo: DEMO_PHOTOS.caller,
    highlights: [
      'Talk to it from your browser, or get a real call on your phone',
      'Interrupt it mid-sentence: it stops and listens',
      'See the live transcript of everything said',
    ],
  },
  'whatsapp-demo': {
    icon: WhatsAppIcon,
    photo: DEMO_PHOTOS.chat,
    highlights: [
      'Chat with sample businesses: clinics, restaurants, hotels, salons and more',
      'Buttons, lists, catalogues, payments, tickets and reminders',
      'Type freely: the AI understands what you mean',
    ],
  },
};

/** "WhatsApp Demo · Exyconn" -> "WhatsApp Demo": the registry title without the brand suffix. */
const shortTitle = (title: string): string => title.split('·')[0].trim();

/**
 * Every demo served from demos.exyconn.com, in registry order: an app that shares the demos
 * origin under its own base path. Adding a demo to apps.json (and a look above) lists it here.
 */
export const DEMOS: DemoEntry[] = (Object.keys(PORTAL_APPS) as PortalAppKey[]).flatMap((key) => {
  const look = DEMO_LOOKS[key];
  if (!look) {
    return [];
  }
  const { title, description } = PORTAL_APPS[key];
  return [{ key, title: shortTitle(title), description, url: appBaseUrl(key), ...look }];
});
