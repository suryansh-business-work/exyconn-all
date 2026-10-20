import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AudienceReach } from '../../../../src/pages/audiences/AudienceReach';
import { renderWithProviders } from '../../test-utils';
import { answered, pending } from '../../fixtures';
import { audienceCounts } from './audience.fixtures';

const gql = vi.hoisted(() => ({ resolution: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAudienceResolutionCountsQuery: (options: unknown) => gql.resolution(options),
}));

const resolved = (counts = audienceCounts()) =>
  answered({ audienceResolution: { resolvedAt: '2026-10-20T09:00:00.000Z', counts } });

describe('AudienceReach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.resolution.mockReturnValue(resolved());
  });

  it('resolves the audience afresh, never from the cache', () => {
    renderWithProviders(<AudienceReach audienceId="audience-7" />);

    expect(gql.resolution).toHaveBeenCalledWith({
      variables: { id: 'audience-7' },
      fetchPolicy: 'network-only',
    });
  });

  it('says how many unique addresses the send reaches and why the rest are left out', () => {
    renderWithProviders(<AudienceReach audienceId="audience-1" />);

    const status = screen.getByRole('status');
    // 120 contacts + 30 companies + 5 clients; 9 suppressed + 12 invalid + 6 excluded.
    expect(status).toHaveTextContent(
      'This send goes to 1,430 unique email address(es), from 155 matching record(s). 27 address(es) are excluded as unsubscribed, blocked, invalid or filtered, and 40 duplicate(s) are sent once.',
    );
    expect(status).toHaveClass('MuiAlert-colorInfo');
  });

  it('warns when nobody would receive the send', () => {
    gql.resolution.mockReturnValue(resolved(audienceCounts({ eligible: 0 })));
    renderWithProviders(<AudienceReach audienceId="audience-1" />);

    expect(screen.getByRole('status')).toHaveClass('MuiAlert-colorWarning');
    expect(screen.getByRole('status')).toHaveTextContent('This send goes to 0 unique');
  });

  it('shows a placeholder while the audience resolves', () => {
    gql.resolution.mockReturnValue(pending());
    renderWithProviders(<AudienceReach audienceId="audience-1" />);

    expect(screen.getByLabelText('Updating counts…')).toHaveClass('MuiSkeleton-root');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the server error when the audience cannot be resolved', () => {
    gql.resolution.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Audience not found'),
    });
    renderWithProviders(<AudienceReach audienceId="audience-1" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Audience not found');
  });

  it('renders nothing when the server answers without a resolution', () => {
    gql.resolution.mockReturnValue({ data: undefined, loading: false, error: undefined });
    const { container } = renderWithProviders(<AudienceReach audienceId="audience-1" />);

    expect(container).toBeEmptyDOMElement();
  });
});
