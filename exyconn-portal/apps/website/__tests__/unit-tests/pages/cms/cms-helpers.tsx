import type { ReactElement, ReactNode } from 'react';
import { render, renderHook } from '@testing-library/react';
import { CmsSiteStatus } from '@exyconn/shell/graphql/generated';
import {
  SiteContext,
  type CmsSite,
  type CurrentSite,
} from '../../../../src/pages/cms/site/site.context';
import { createWrapper, useCurrentUrl, type ProviderOptions } from '../../test-utils';

export { formatDate, formatDateTime, settingsModuleMock } from './cms-settings.mock';

/** A website as the CMS sites query returns it; override what a test cares about. */
export function siteFixture(overrides: Partial<CmsSite> = {}): CmsSite {
  return {
    id: 'site-1',
    name: 'Exyconn',
    slug: 'main',
    domains: ['exyconn.com'],
    isDefault: true,
    status: CmsSiteStatus.Active,
    markets: false,
    defaultLocale: 'en',
    faviconUrl: '',
    headerFragmentId: '',
    footerFragmentId: '',
    designSystemId: 'design-1',
    headHtml: '',
    bodyEndHtml: '',
    globalCss: '',
    notFoundPageId: '',
    updatedAt: '2026-01-02T00:00:00.000Z',
    seo: { titleTemplate: '%s', description: '', ogImageUrl: '' },
    ...overrides,
  };
}

/** The portal providers plus the current website a /website/s/:siteSlug page reads. */
export interface SiteOptions extends ProviderOptions {
  site?: CmsSite;
  sites?: readonly CmsSite[];
  refetchSites?: () => Promise<unknown>;
}

/** A wrapper that mounts the site layout's context under the website portal providers. */
export function siteWrapper({
  site = siteFixture(),
  sites,
  refetchSites = () => Promise.resolve(),
  ...providers
}: Readonly<SiteOptions> = {}) {
  const Providers = createWrapper(providers);
  const value: CurrentSite = { site, sites: sites ?? [site], refetchSites };
  return function SiteProviders({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <Providers>
        <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
      </Providers>
    );
  };
}

/** `render` inside a website: the portal providers and the current site. */
export function renderInSite(ui: ReactElement, options: Readonly<SiteOptions> = {}) {
  return render(ui, { wrapper: siteWrapper(options) });
}

/** `renderHook` inside a website: the portal providers and the current site. */
export function renderHookInSite<Result>(hook: () => Result, options: Readonly<SiteOptions> = {}) {
  return renderHook(hook, { wrapper: siteWrapper(options) });
}

/** Prints the router's current URL, so a test can see where a page navigated. */
export function UrlProbe() {
  const url = useCurrentUrl();
  return <output aria-label="current url">{url}</output>;
}

/** An Apollo query result as a generated hook returns it. */
export function queryResult<TData>(
  data: TData | undefined,
  extra: Readonly<{ loading?: boolean; error?: Error; refetch?: () => Promise<unknown> }> = {},
) {
  return {
    data,
    loading: extra.loading ?? false,
    error: extra.error,
    refetch: extra.refetch ?? (() => Promise.resolve({ data })),
  };
}
