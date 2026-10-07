import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { ComposeTab } from '../../../../src/pages/social/ComposeTab';
import { renderWithProviders } from '../../test-utils';
import { UrlProbe } from '../../form-stub';
import { accountRow, ruleRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ accounts: vi.fn(), rules: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialAccountsQuery: () => gql.accounts(),
  useSocialNetworkRulesQuery: () => gql.rules(),
}));

vi.mock('../../../../src/pages/social/forms/social-post', async () => ({
  SocialPostForm: (await import('./composer-stub')).ComposerStub,
}));

describe('ComposeTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.accounts.mockReturnValue({ data: { socialAccounts: [accountRow()] }, loading: false });
    gql.rules.mockReturnValue({
      data: { socialNetworkRules: [ruleRow(SocialNetwork.Facebook)] },
      loading: false,
    });
  });

  it('opens a new post for the connected accounts and their network rules', () => {
    renderWithProviders(<ComposeTab />);

    expect(screen.getByText('1 accounts, 1 rules, new')).toBeInTheDocument();
  });

  it('waits for the accounts before showing the composer', () => {
    gql.accounts.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<ComposeTab />);

    expect(screen.getByRole('progressbar', { name: 'Loading accounts' })).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText(/accounts, .* rules/)).not.toBeInTheDocument();
  });

  it('keeps the composer up while the accounts it already has refetch', () => {
    gql.accounts.mockReturnValue({ data: { socialAccounts: [accountRow()] }, loading: true });
    renderWithProviders(<ComposeTab />);

    expect(screen.getByText('1 accounts, 1 rules, new')).toBeInTheDocument();
  });

  it('starts an empty composer after each post', async () => {
    renderWithProviders(<ComposeTab />);
    await userEvent.click(screen.getByRole('button', { name: 'Type something' }));
    expect(screen.getByText('Half-written post')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText('Half-written post')).not.toBeInTheDocument();
    expect(screen.getByText('1 accounts, 1 rules, new')).toBeInTheDocument();
  });

  it('goes to the posts list on cancel', async () => {
    renderWithProviders(
      <>
        <ComposeTab />
        <UrlProbe />
      </>,
      { route: '/marketing/social/compose' },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    expect(screen.getByRole('status', { name: 'current url' })).toHaveTextContent(
      '/marketing/social/posts',
    );
  });
});
