import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceMemberKind } from '@exyconn/shell/graphql/generated';
import { AudienceMembers } from '../../../../src/pages/audiences/AudienceMembers';
import { renderWithProviders } from '../../test-utils';
import { answered, pending } from '../../fixtures';

const gql = vi.hoisted(() => ({ members: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAudienceMembersQuery: (options: unknown) => gql.members(options),
}));

const MEMBERS = [
  {
    id: 'm1',
    email: 'asha@acme.io',
    name: 'Asha Rao',
    company: 'Acme',
    status: 'ACTIVE',
    kind: AudienceMemberKind.Client,
  },
  {
    id: 'm2',
    email: 'ravi@globex.com',
    name: '',
    company: '',
    status: 'UNSUBSCRIBED',
    kind: AudienceMemberKind.Contact,
  },
];

describe('AudienceMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.members.mockReturnValue({
      ...answered({ audienceMembers: MEMBERS }),
      refetch: gql.refetch,
    });
  });

  it('asks the server who this audience reaches, by its id', () => {
    renderWithProviders(<AudienceMembers audienceId="audience-4" audienceName="VIPs" />);

    expect(gql.members).toHaveBeenCalledWith({ variables: { id: 'audience-4' } });
    expect(
      screen.getByText('“VIPs” reaches 2 recipient(s), de-duplicated by address.'),
    ).toBeInTheDocument();
  });

  it('lists each recipient, falling back to the address and a dash when details are missing', () => {
    renderWithProviders(<AudienceMembers audienceId="audience-4" audienceName="VIPs" />);
    const [, first, second] = screen.getAllByRole('row');

    expect(within(first).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(first).getByText('Acme')).toBeInTheDocument();
    expect(within(first).getByText('CLIENT')).toBeInTheDocument();
    expect(within(first).getByText('ACTIVE')).toBeInTheDocument();
    expect(within(second).getAllByText('ravi@globex.com')).toHaveLength(2);
    expect(within(second).getByText('—')).toBeInTheDocument();
    expect(within(second).getByText('CONTACT')).toBeInTheDocument();
  });

  it('re-asks the server when the table is refreshed', async () => {
    renderWithProviders(<AudienceMembers audienceId="audience-4" audienceName="VIPs" />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('says nobody matches while the audience resolves to no one', () => {
    gql.members.mockReturnValue(answered({ audienceMembers: [] }));
    renderWithProviders(<AudienceMembers audienceId="audience-4" audienceName="VIPs" />);

    expect(screen.getByText('Nobody matches this audience yet.')).toBeInTheDocument();
    expect(
      screen.getByText('“VIPs” reaches 0 recipient(s), de-duplicated by address.'),
    ).toBeInTheDocument();
  });

  it('counts zero and shows loading rows before the answer arrives', () => {
    gql.members.mockReturnValue(pending());
    renderWithProviders(<AudienceMembers audienceId="audience-4" audienceName="VIPs" />);

    expect(screen.getByText(/reaches 0 recipient/)).toBeInTheDocument();
    expect(screen.queryByText('Nobody matches this audience yet.')).not.toBeInTheDocument();
  });
});
