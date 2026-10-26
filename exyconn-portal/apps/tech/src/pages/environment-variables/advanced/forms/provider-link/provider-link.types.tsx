import type {
  ProviderLinkInput,
  TechProviderProfileFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type ProviderLinkRow = TechProviderProfileFieldsFragment['links'][number];

/** One link the team keeps for a provider: its console, usage or billing page. */
export type ProviderLinkFormValues = ProviderLinkInput;
