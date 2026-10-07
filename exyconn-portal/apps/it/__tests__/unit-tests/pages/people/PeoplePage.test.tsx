import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { roleList } from '@exyconn/shell/auth/roles';
import { PeoplePage } from '../../../../src/pages/people';
import { renderWithProviders } from '../../test-utils';
import { profileRow } from '../page-kit/people.fixtures';

const gql = vi.hoisted(() => ({ profile: vi.fn(), assignees: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItEmployeeProfileQuery: (options: unknown) => gql.profile(options),
  useListAssetAssigneesQuery: () => gql.assignees(),
}));

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../page-kit/settings.mock')).settingsModule,
);

const profileRoute = { route: '/it/people/emp-1', path: '/it/people/:id' };

function answer(itEmployeeProfile: unknown, extra: Record<string, unknown> = {}) {
  return { data: { itEmployeeProfile }, loading: false, error: undefined, ...extra };
}

/** The text of the fact labelled `label` in the profile panel. */
function fact(label: string): string {
  const term = screen.getByText(label);
  return term.parentElement?.textContent ?? '';
}

describe('PeoplePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.assignees.mockReturnValue({ data: undefined, loading: false });
    gql.profile.mockReturnValue(answer(profileRow()));
  });

  it('asks for an employee and reads nothing until one is picked', () => {
    gql.profile.mockReturnValue({ data: undefined, loading: false, error: undefined });
    renderWithProviders(<PeoplePage />);

    expect(gql.profile).toHaveBeenCalledWith({
      variables: { employeeId: '' },
      skip: true,
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { name: 'Employee IT Profile' })).toBeInTheDocument();
    expect(
      screen.getByText('Pick an employee to see their devices and access.'),
    ).toBeInTheDocument();
  });

  it('reads the profile of the employee in the address', () => {
    renderWithProviders(<PeoplePage />, profileRoute);

    expect(gql.profile).toHaveBeenCalledWith({
      variables: { employeeId: 'emp-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
  });

  it('shows loading, then the error, while there is no profile', () => {
    gql.profile.mockReturnValue({ data: undefined, loading: true, error: undefined });
    const { unmount } = renderWithProviders(<PeoplePage />, profileRoute);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    unmount();

    gql.profile.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('No such employee'),
    });
    renderWithProviders(<PeoplePage />, profileRoute);
    expect(screen.getByText('No such employee')).toBeInTheDocument();
  });

  it('lays out the account facts', () => {
    renderWithProviders(<PeoplePage />, profileRoute);

    expect(fact('Email')).toContain('asha@exyconn.test');
    expect(fact('Department')).toContain('Engineering');
    expect(fact('Designation')).toContain('Developer');
    expect(fact('Account')).toContain('ACTIVE');
    expect(fact('Portal roles')).toContain(roleList(['EMPLOYEE'], (text) => text));
    expect(fact('Last active')).toContain('datetime(2026-10-01T09:00:00.000Z)');
    expect(fact('Open IT tickets')).toContain('2');
  });

  it('marks missing facts with a dash', () => {
    const profile = profileRow({ department: null, designation: null, lastActiveAt: null });
    gql.profile.mockReturnValue(answer(profile));
    renderWithProviders(<PeoplePage />, profileRoute);

    expect(fact('Department')).toContain('—');
    expect(fact('Designation')).toContain('—');
    expect(fact('Last active')).toContain('—');
  });

  it('says a blocked account is blocked and a deactivated one inactive', () => {
    gql.profile.mockReturnValue(answer(profileRow({ isBlocked: true })));
    const { unmount } = renderWithProviders(<PeoplePage />, profileRoute);
    expect(fact('Account')).toContain('BLOCKED');
    unmount();

    gql.profile.mockReturnValue(answer(profileRow({ isActive: false, isBlocked: true })));
    renderWithProviders(<PeoplePage />, profileRoute);
    expect(fact('Account')).toContain('INACTIVE');
  });

  it('shows every profile section, saying None where there is nothing', () => {
    renderWithProviders(<PeoplePage />, profileRoute);

    expect(screen.getByText('Assigned devices')).toBeInTheDocument();
    expect(screen.getByText('Application access, VPN & email')).toBeInTheDocument();
    expect(screen.getByText('Software licences')).toBeInTheDocument();
    expect(screen.getByText('Requests in progress')).toBeInTheDocument();
    expect(screen.getAllByText('None')).toHaveLength(4);
  });
});
