import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaReleaseStatus,
  useMaReleaseDownloadLinkMutation,
  useMaReleasesQuery,
} from '@exyconn/shell/graphql/generated';
import { ReleaseDetailsPage } from '../../../src/releases/ReleaseDetailsPage';
import { makeRelease } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaReleasesQuery: vi.fn(),
  useMaReleaseDownloadLinkMutation: vi.fn(),
}));

const link = vi.fn();
const PATH = '/ai/meeting-assistant/releases/:id';

const answer = (result: ReturnType<typeof queryResult>) =>
  vi.mocked(useMaReleasesQuery).mockReturnValue(result as never);

const renderPage = (id = 'release-1') =>
  renderWithProviders(<ReleaseDetailsPage />, {
    route: `/ai/meeting-assistant/releases/${id}`,
    path: PATH,
  });

beforeEach(() => {
  link.mockReset().mockResolvedValue({ data: undefined });
  vi.mocked(useMaReleaseDownloadLinkMutation).mockReturnValue(mutationTuple(link) as never);
  answer(
    queryResult({
      maReleases: [
        makeRelease({ releaseNotes: 'Faster sign-in' }),
        makeRelease({
          id: 'old',
          version: '1.3.0',
          status: MaReleaseStatus.Deprecated,
          downloadable: false,
          releaseNotes: '',
        }),
      ],
    }),
  );
});

describe('ReleaseDetailsPage', () => {
  it('shows every field of the build, its notes, and downloads it', async () => {
    renderPage();
    expect(vi.mocked(useMaReleasesQuery).mock.lastCall?.[0]).toEqual({
      fetchPolicy: 'cache-first',
    });
    expect(screen.getByRole('heading', { name: 'Build 1.4.0' })).toBeInTheDocument();
    expect(screen.getByText('meeting-assistant-1.4.0.zip')).toBeInTheDocument();
    expect(screen.getByText('Faster sign-in')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(link).toHaveBeenCalledWith({ variables: { id: 'release-1' } });
  });

  it('opens the status history, and offers no download for a build nobody may get', async () => {
    renderPage('old');
    expect(screen.getByText('No release notes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Status history' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/1\.3\.0/)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('waits while the builds load, and says why they could not be read', async () => {
    answer(queryResult(undefined, { loading: true }));
    const { unmount } = renderPage();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    unmount();
    const refetch = vi.fn().mockResolvedValue({});
    answer(queryResult(undefined, { error: new Error('Network down'), refetch }));
    renderPage();
    expect(screen.getByText('Network down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Retry|Try again/ }));
    expect(refetch).toHaveBeenCalled();
  });

  it('says a build is gone, and goes back to Builds', async () => {
    renderPage('missing');
    expect(
      screen.getByText('This build no longer exists. It may have been deleted.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to Builds' }));
    expect(screen.getByLabelText('location')).toHaveTextContent('/ai/meeting-assistant/releases');
  });
});
