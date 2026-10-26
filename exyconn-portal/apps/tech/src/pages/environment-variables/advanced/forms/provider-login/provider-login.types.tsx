import type {
  ProviderLoginInput,
  TechProviderProfileFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type ProviderLoginRow = TechProviderProfileFieldsFragment['logins'][number];

/** One account a provider's keys were made under, as the form edits it. */
export type ProviderLoginFormValues = ProviderLoginInput;
