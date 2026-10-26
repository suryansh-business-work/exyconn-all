/**
 * What Tech > Environment Variables says about one provider beyond its keys: whether reading
 * its bill needs a separate key, how to create the keys, and where its consoles are. Strings
 * sit under `label` / `message` / `description` so the i18n extractor collects them.
 */

/** REQUIRED: a different key reads billing. SAME_KEY: the current key does. PERMISSION: the
 *  current key does once it is granted the billing permission. NO_BILLING_API: nothing to read. */
export type BillingKeyNeed = 'REQUIRED' | 'SAME_KEY' | 'PERMISSION' | 'NO_BILLING_API';

export type ProviderLinkKind = 'DASHBOARD' | 'API_KEYS' | 'USAGE' | 'BILLING' | 'DOCS' | 'OTHER';

export interface ProviderLink {
  label: string;
  url: string;
  kind: ProviderLinkKind;
}

export interface ProviderGuide {
  /** The Environment Variables section slug. */
  provider: string;
  label: string;
  billing: { need: BillingKeyNeed; message: string };
  steps: ReadonlyArray<{ description: string }>;
  links: readonly ProviderLink[];
}
