import { defaultsOf } from '../place';

export interface AiServiceEntry {
  slug: string;
  title: string;
  summary: string;
}

export interface AiServiceCategory {
  slug: string;
  title: string;
  description: string;
  services: AiServiceEntry[];
}

export const SITE = 'https://exyconn.com';
export const AI_SERVICES_PATH = '/ai-services';

/** The AI service catalogue as the website's catalogue component ships it (@exyconn/cms). */
export const AI_SERVICE_CATEGORIES = defaultsOf('aiservice.catalogue')
  .categories as AiServiceCategory[];

export const aiServicePath = (service: AiServiceEntry): string =>
  `${AI_SERVICES_PATH}/${service.slug}`;

/** schema.org list items, numbered from one, each with the fields `item` gives it. */
export function listItems<T>(entries: T[], item: (entry: T) => Record<string, unknown>) {
  return entries.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    ...item(entry),
  }));
}
