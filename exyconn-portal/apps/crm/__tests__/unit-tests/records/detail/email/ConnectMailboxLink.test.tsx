import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectMailboxLink } from '../../../../../src/records/detail';
import { renderWithProviders } from '../../../test-utils';
import { UrlProbe } from '../../../form-stub';

const gql = vi.hoisted(() => ({ status: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmIntegrationStatusQuery: () => gql.status(),
}));

const answer = (email: { gmail: boolean; microsoft: boolean } | null) =>
  gql.status.mockReturnValue({
    data: email ? { crmIntegrationStatus: { email } } : undefined,
  });

const LINK = 'Connect an email account in Integrations';

describe('ConnectMailboxLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('points to Integrations > Email while no mailbox is connected', async () => {
    answer({ gmail: false, microsoft: false });
    renderWithProviders(
      <>
        <ConnectMailboxLink />
        <UrlProbe />
      </>,
      { route: '/contacts/c1/overview' },
    );

    const link = screen.getByRole('link', { name: LINK });
    expect(link).toHaveAttribute('href', '/integrations/email');
    await userEvent.click(link);
    expect(screen.getByLabelText('current url')).toHaveTextContent('/integrations/email');
  });

  it.each([
    ['Gmail', { gmail: true, microsoft: false }],
    ['Microsoft', { gmail: false, microsoft: true }],
  ])('stays hidden once a %s mailbox is connected', (_provider, email) => {
    answer(email);
    renderWithProviders(<ConnectMailboxLink />);

    expect(screen.queryByRole('link', { name: LINK })).not.toBeInTheDocument();
  });

  it('shows nothing until the status has loaded', () => {
    answer(null);
    renderWithProviders(<ConnectMailboxLink />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
