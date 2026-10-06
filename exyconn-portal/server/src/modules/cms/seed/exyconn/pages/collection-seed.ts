import { cmsComponent, componentPlaceholder } from '@exyconn/cms';
import type { CmsSeedPage } from '../../types';

/** The SEO a collection page is seeded with; blank fields fall back to the site's defaults. */
interface CollectionSeo {
  title: string;
  description: string;
  keywords?: string;
  ogImageUrl?: string;
}

interface CollectionPage {
  key: string;
  path: string;
  kind: CmsSeedPage['kind'];
  title: string;
  seo: CollectionSeo;
  /** Catalogue components, in order, each with its catalogue defaults (the page's real copy). */
  components: readonly string[];
}

/** A catalogue component placed with its defaults. */
function placed(key: string): string {
  const component = cmsComponent(key);
  if (!component) {
    throw new Error(`The CMS seed places "${key}", which is not in the component catalogue.`);
  }
  return componentPlaceholder(key, component.defaultProps, '');
}

/**
 * A page (or template) of exyconn.com's collections — blog, case studies, careers, tools,
 * policies, newsletter — made of catalogue components. A template's SEO names its item's
 * values in braces ("{title} | Exyconn Blog"); the website fills them from the item.
 */
export function collectionPage(page: CollectionPage): CmsSeedPage {
  return {
    key: page.key,
    path: page.path,
    kind: page.kind,
    title: page.title,
    layout: 'default',
    seo: {
      title: page.seo.title,
      description: page.seo.description,
      keywords: page.seo.keywords ?? '',
      ogImageUrl: page.seo.ogImageUrl ?? '',
      canonical: '',
      noindex: false,
      jsonLd: null,
    },
    html: page.components.map(placed).join(''),
    css: '',
  };
}
