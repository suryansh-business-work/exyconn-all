import type { CatalogBundle } from '@exyconn/bot-studio/runtime';

type Business = CatalogBundle['demo']['business'];
type Workflow = CatalogBundle['workflows'][number];

/** A published workflow; the page reads its key, name, description and keywords. */
export function workflow(key: string, name: string, keywords: string[] = []): Workflow {
  return {
    key,
    name,
    description: `${name} from start to finish`,
    keywords,
    order: 0,
    graph: { start: 'start', nodes: [], edges: [] },
  } as unknown as Workflow;
}

/** A demo website as the catalogue serves it. */
export function site(
  key: string,
  business: Partial<Business> = {},
  workflows: Workflow[] = [],
): CatalogBundle {
  return {
    revision: 'r1',
    workflows,
    demo: {
      key,
      channel: 'website',
      industry: key === 'store' ? 'Online store' : 'Services firm',
      greeting: 'Hello',
      menuText: 'How can we help?',
      menuButton: 'Menu',
      order: 0,
      active: true,
      business: {
        name: key === 'store' ? 'Kirana Online' : 'Northwind Advisory',
        tagline: 'Advice that pays for itself',
        category: 'Consulting',
        about: 'Tax, audit and growth advice for small firms.',
        icon: 'business',
        accent: 'blue',
        verified: true,
        phone: '+91 80 4000 0000',
        email: 'hello@northwind.example',
        website: 'https://northwind.example',
        address: 'MG Road, Bengaluru',
        hours: 'Mon–Sat 9–6',
        ...business,
      },
    },
  };
}
