import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormatters } from '@exyconn/i18n';
import { AudienceMembers } from '../../../../src/pages/audiences/AudienceMembers';
import { renderHookWithProviders, renderWithProviders } from '../../test-utils';
import { pending } from '../../fixtures';
import { audienceCounts } from './audience.fixtures';

const gql = vi.hoisted(() => ({ resolution: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAudienceResolutionCountsQuery: (options: unknown) => gql.resolution(options),
}));

vi.mock('../../../../src/pages/audiences/AudienceRecipientsGrid', () => ({
  AudienceRecipientsGrid: ({ target }: Readonly<{ target: unknown }>) => (
    <p>{`Recipients of ${JSON.stringify(target)}`}</p>
  ),
}));

const RESOLVED_AT = '2026-10-20T09:00:00.000Z';

function resolved() {
  return {
    data: { audienceResolution: { resolvedAt: RESOLVED_AT, counts: audienceCounts() } },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
  };
}

const renderMembers = () =>
  renderWithProviders(<AudienceMembers audienceId="audience-1" audienceName="Newsletter" />);

describe('AudienceMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.resolution.mockReturnValue(resolved());
  });

  it('resolves the saved audience afresh each time it opens', () => {
    renderMembers();

    expect(gql.resolution).toHaveBeenCalledWith({
      variables: { id: 'audience-1' },
      fetchPolicy: 'network-only',
    });
  });

  it('says how many unique addresses the audience reaches and when it was checked', () => {
    const { result } = renderHookWithProviders(() => useFormatters());
    renderMembers();

    expect(screen.getByRole('status')).toHaveTextContent(
      `“Newsletter” reaches 1,430 unique address(es). Last refreshed ${result.current.formatDateTime(RESOLVED_AT)}.`,
    );
    expect(screen.getByText('Final eligible recipients').previousSibling).toHaveTextContent(
      '1,430',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lists the recipients of the saved audience, not a draft', () => {
    renderMembers();

    expect(screen.getByText('Recipients of {"audienceId":"audience-1"}')).toBeInTheDocument();
  });

  it('says the counts are updating until the server answers', () => {
    gql.resolution.mockReturnValue(pending());
    renderMembers();

    expect(screen.getByRole('status')).toHaveTextContent('Updating counts…');
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(11);
  });

  it('shows the error with a retry that asks again', async () => {
    gql.resolution.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Resolution failed'),
      refetch: gql.refetch,
    });
    renderMembers();

    expect(screen.getByRole('alert')).toHaveTextContent('Resolution failed');
    expect(screen.getByRole('status')).toHaveTextContent('Updating counts…');

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
