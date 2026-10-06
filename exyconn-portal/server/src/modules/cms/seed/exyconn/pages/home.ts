import { cmsComponent, componentPlaceholder } from '@exyconn/cms';
import type { CmsSeedPage } from '../../types';

/** A catalogue component with the props it is seeded with: its defaults, the page's own copy. */
function section(key: string, childrenHtml = ''): string {
  const component = cmsComponent(key);
  if (!component) {
    throw new Error(`The CMS seed places "${key}", which is not in the component catalogue.`);
  }
  return componentPlaceholder(key, component.defaultProps, childrenHtml);
}

/**
 * exyconn.com's home page (formerly exyconn-website/src/pages/[market]/index.astro): the home
 * stage, with the five chapters and the platforms marquee scrolling over it.
 */
export const HOME_PAGE: CmsSeedPage = {
  key: 'home',
  path: '/',
  kind: 'PAGE',
  title: 'Exyconn | AI Agents, Automation & Vertical AI SaaS',
  layout: 'default',
  seo: {
    title: 'Exyconn | AI Agents, Automation & Vertical AI SaaS',
    description:
      'Exyconn builds AI agents, automation and vertical AI products across {serviceCount} service areas — sales, support, voice, finance, hiring, logistics and the platform layer underneath.',
    keywords:
      'AI agents, AI automation, AI sales automation, AI customer support, AI voice agents, WhatsApp automation, vertical AI SaaS, AI workflow automation, RAG platform, AI governance',
    ogImageUrl: '',
    canonical: '',
    noindex: false,
    jsonLd: null,
  },
  html: section(
    'home.stage',
    [
      section('home.hero'),
      section('home.solutions'),
      section('home.industries'),
      section('home.partner'),
      section('home.platforms'),
      section('home.closing'),
    ].join(''),
  ),
  css: '',
};
