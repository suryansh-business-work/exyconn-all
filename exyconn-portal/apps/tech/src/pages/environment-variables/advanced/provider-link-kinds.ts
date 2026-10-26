import { ProviderLinkKind } from '@exyconn/shell/graphql/generated';

/** What each kind of provider link is called on the page. */
export const LINK_KIND_LABELS: Readonly<Record<ProviderLinkKind, { label: string }>> = {
  [ProviderLinkKind.Dashboard]: { label: 'Dashboard' },
  [ProviderLinkKind.ApiKeys]: { label: 'API keys' },
  [ProviderLinkKind.Usage]: { label: 'Usage' },
  [ProviderLinkKind.Billing]: { label: 'Billing' },
  [ProviderLinkKind.Docs]: { label: 'Documentation' },
  [ProviderLinkKind.Other]: { label: 'Other' },
};
