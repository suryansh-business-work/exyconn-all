import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { useComposerData } from '../../../../src/pages/social/useComposerData';
import { renderHookWithProviders } from '../../test-utils';
import { accountRow, ruleRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ accounts: vi.fn(), rules: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialAccountsQuery: (options: unknown) => gql.accounts(options),
  useSocialNetworkRulesQuery: () => gql.rules(),
}));

describe('useComposerData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hands over the accounts and the rules of each network once both arrive', () => {
    const accounts = [accountRow()];
    const rules = [ruleRow(SocialNetwork.Facebook)];
    gql.accounts.mockReturnValue({ data: { socialAccounts: accounts }, loading: false });
    gql.rules.mockReturnValue({ data: { socialNetworkRules: rules }, loading: false });

    const { result } = renderHookWithProviders(() => useComposerData());

    expect(gql.accounts).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(result.current).toEqual({ accounts, rules, loading: false, accountsFirstLoad: false });
  });

  it('is first-loading only until the accounts have arrived once', () => {
    gql.accounts.mockReturnValue({ data: undefined, loading: true });
    gql.rules.mockReturnValue({ data: undefined, loading: false });

    const { result } = renderHookWithProviders(() => useComposerData());

    expect(result.current).toEqual({
      accounts: [],
      rules: [],
      loading: true,
      accountsFirstLoad: true,
    });
  });

  it('keeps showing the accounts while they refetch, and waits on the rules', () => {
    gql.accounts.mockReturnValue({ data: { socialAccounts: [] }, loading: true });
    gql.rules.mockReturnValue({ data: undefined, loading: true });

    const { result } = renderHookWithProviders(() => useComposerData());

    expect(result.current.loading).toBe(true);
    expect(result.current.accountsFirstLoad).toBe(false);
  });
});
