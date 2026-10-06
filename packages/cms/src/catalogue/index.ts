import type { CmsComponentDef } from './types';
import { CHROME_COMPONENTS } from './chrome';
import { HOME_COMPONENTS } from './home';
import { AGENTS_COMPONENTS } from './agents';
import { COMPANY_COMPONENTS } from './company';
import { FORMS_COMPONENTS } from './forms';
import { LEGAL_COMPONENTS } from './legal';
import { OFFER_COMPONENTS } from './offer';
import { DETAIL_COMPONENTS } from './detail';
import { SERVICE_COMPONENTS } from './service';
import { AI_COMPONENTS } from './ai';
import { AISERVICE_COMPONENTS } from './aiservice';
import { BLOG_COMPONENTS } from './blog';
import { CASESTUDY_COMPONENTS } from './casestudy';
import { CAREER_COMPONENTS } from './career';
import { TOOLS_COMPONENTS } from './tools';
import { POLICY_COMPONENTS } from './policy';
import { NEWSLETTER_COMPONENTS } from './newsletter';

export type { CmsComponentDef } from './types';

/**
 * Every dynamic component the website can render, by area. A new area adds its file here and
 * its renderers to the website's registry.
 */
const CATALOGUE = [
  ...CHROME_COMPONENTS,
  ...HOME_COMPONENTS,
  ...COMPANY_COMPONENTS,
  ...LEGAL_COMPONENTS,
  ...FORMS_COMPONENTS,
  ...AGENTS_COMPONENTS,
  ...OFFER_COMPONENTS,
  ...DETAIL_COMPONENTS,
  ...SERVICE_COMPONENTS,
  ...AI_COMPONENTS,
  ...AISERVICE_COMPONENTS,
  ...BLOG_COMPONENTS,
  ...CASESTUDY_COMPONENTS,
  ...CAREER_COMPONENTS,
  ...TOOLS_COMPONENTS,
  ...POLICY_COMPONENTS,
  ...NEWSLETTER_COMPONENTS,
] as const;

export const CMS_COMPONENTS: readonly CmsComponentDef[] = CATALOGUE;

/**
 * The union of every catalogue key. The website's registry is typed against it, so a key
 * without a renderer (or a renderer without a key) fails the website's typecheck.
 */
export type CmsComponentKey = (typeof CATALOGUE)[number]['key'];

const BY_KEY = new Map(CMS_COMPONENTS.map((component) => [component.key, component]));

/** The catalogue entry for a key, or undefined. */
export function cmsComponent(key: string): CmsComponentDef | undefined {
  return BY_KEY.get(key);
}

/** The props a component takes, as its catalogue defaults shape them. */
export type CmsComponentProps<K extends CmsComponentKey> = Extract<
  (typeof CATALOGUE)[number],
  { key: K }
>['defaultProps'];
