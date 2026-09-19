import {
  useSocialAccountsQuery,
  useSocialNetworkRulesQuery,
} from '@exyconn/shell/graphql/generated';

/** What the composer needs to know: the accounts to post to, and what each network takes. */
export function useComposerData() {
  const accounts = useSocialAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const rules = useSocialNetworkRulesQuery();
  return {
    accounts: accounts.data?.socialAccounts ?? [],
    rules: rules.data?.socialNetworkRules ?? [],
    loading: accounts.loading || rules.loading,
  };
}
