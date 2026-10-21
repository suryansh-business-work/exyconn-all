import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMaReleaseOverviewQuery } from '@exyconn/shell/graphql/generated';
import { NoReleaseState } from '../../../src/extension/NoReleaseState';
import { queryResult, renderWithProviders, stubLocationAssign } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaReleaseOverviewQuery: vi.fn(),
}));

function overview(releaseManager: boolean, registered: number, awaitingApproval: number) {
  vi.mocked(useMaReleaseOverviewQuery).mockReturnValue(
    queryResult({ maReleaseOverview: { releaseManager, registered, awaitingApproval } }) as never,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NoReleaseState', () => {
  it('tells people to check back, with nothing to click', () => {
    overview(false, 0, 0);
    renderWithProviders(<NoReleaseState />);
    expect(screen.getByText('The extension is not available yet')).toBeInTheDocument();
    expect(
      screen.getByText("Your administrator hasn't published the extension yet. Check back later."),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Releases' })).not.toBeInTheDocument();
    expect(vi.mocked(useMaReleaseOverviewQuery).mock.lastCall?.[0]).toMatchObject({
      fetchPolicy: 'cache-and-network',
    });
  });

  it('points a release manager at a build waiting for approval', async () => {
    const assign = stubLocationAssign();
    overview(true, 3, 1);
    renderWithProviders(<NoReleaseState />);
    expect(screen.getByText('A build is waiting for approval')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open Releases' }));
    expect(assign).toHaveBeenCalledWith(
      expect.stringMatching(/\/ai\/meeting-assistant\/releases$/),
    );
  });

  it('tells a release manager when every build is out of reach, or none exists', () => {
    overview(true, 2, 0);
    const first = renderWithProviders(<NoReleaseState />);
    expect(screen.getByText('No build is ready to download')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Releases' })).toBeInTheDocument();
    first.unmount();
    overview(true, 0, 0);
    renderWithProviders(<NoReleaseState />);
    expect(screen.getByText('No build registered yet')).toBeInTheDocument();
    expect(screen.getByText(/click Build new release on the Releases page/)).toBeInTheDocument();
  });

  it('shows loading, then an error with Retry', async () => {
    vi.mocked(useMaReleaseOverviewQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const first = renderWithProviders(<NoReleaseState />);
    expect(screen.queryByText('The extension is not available yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    first.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaReleaseOverviewQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Overview down'), refetch }) as never,
    );
    renderWithProviders(<NoReleaseState />);
    expect(screen.getByText('Overview down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
