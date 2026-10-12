import type { CmsSeedPage } from '../../../types';
import { seedPage } from '../../page-doc';
import { AI_SERVICE_CATEGORIES, SITE, aiServicePath, listItems } from './catalogue';
import hub from './hub.json';

const services = AI_SERVICE_CATEGORIES.flatMap((category) => category.services);
const [itemList, breadcrumbs] = hub.seo.jsonLd;

/** exyconn.com/ai-services: the hub's own copy (hub.json) around the catalogue, listed for search. */
export const AI_SERVICES_HUB_PAGE: CmsSeedPage = seedPage({
  ...hub,
  seo: {
    ...hub.seo,
    jsonLd: [
      {
        ...itemList,
        numberOfItems: services.length,
        itemListElement: listItems(services, (service) => ({
          name: service.title,
          description: service.summary,
          url: `${SITE}${aiServicePath(service)}`,
        })),
      },
      breadcrumbs,
    ],
  },
});
