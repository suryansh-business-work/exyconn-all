import { CmsSiteStatus } from '@exyconn/shell/graphql/generated';
import { siteFixture } from '../cms-helpers';

/** The default site, with two domains and markets. */
export const MAIN = siteFixture({ domains: ['exyconn.com', 'www.exyconn.com'], markets: true });

/** A draft blog with no domain, not the default. */
export const BLOG = siteFixture({
  id: 'site-2',
  name: 'Blog',
  slug: 'blog',
  domains: [],
  isDefault: false,
  status: CmsSiteStatus.Draft,
});
