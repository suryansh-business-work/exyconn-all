import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaReleaseChannel,
  MaReleaseStatus,
  useMaApproveReleaseMutation,
  useMaReleaseDownloadLinkMutation,
  useMaReleasesQuery,
  useMaSetReleaseStatusMutation,
  useDeleteMaReleaseMutation,
} from '@exyconn/shell/graphql/generated';
import { ReleasesPage } from '../../../src/releases/ReleasesPage';
import { makeRelease } from '../fixtures';
import { downloadUrls } from '@exyconn/shell/utils/file';
import { mutationTuple, queryResult, renderWithProviders, stubLocationAssign } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaReleasesQuery: vi.fn(),
  useMaSetReleaseStatusMutation: vi.fn(),
  useMaReleaseDownloadLinkMutation: vi.fn(),
  useMaApproveReleaseMutation: vi.fn(),
  useDeleteMaReleaseMutation: vi.fn(),
}));
vi.mock('@exyconn/shell/utils/file', async (orig) => ({
  ...(await orig<object>()),
  downloadUrls: vi.fn(),
}));

const setStatus = vi.fn();
const link = vi.fn();
const approve = vi.fn();
const remove = vi.fn();

beforeEach(() => {
  setStatus.mockReset().mockResolvedValue({ data: {} });
  approve.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useMaApproveReleaseMutation).mockReturnValue(mutationTuple(approve) as never);
  link.mockReset().mockResolvedValue({
    data: {
      maReleaseDownloadLink: {
        url: 'https://files.example.com/r.zip',
        expiresAt: '',
        fileName: 'r.zip',
        sha256: 'ab',
      },
    },
  });
  vi.mocked(useMaSetReleaseStatusMutation).mockReturnValue(mutationTuple(setStatus) as never);
  remove.mockReset().mockResolvedValue({ data: { deleteMaRelease: true } });
  vi.mocked(useDeleteMaReleaseMutation).mockReturnValue(mutationTuple(remove) as never);
  vi.mocked(downloadUrls).mockReset();
  vi.mocked(useMaReleaseDownloadLinkMutation).mockReturnValue(mutationTuple(link) as never);
  vi.mocked(useMaReleasesQuery).mockReturnValue(
    queryResult({
      maReleases: [
        makeRelease({ storeUrl: 'https://chromewebstore.google.com/detail/item' }),
        makeRelease({
          id: 'release-0',
          version: '1.3.0',
          status: MaReleaseStatus.Deprecated,
          downloadable: false,
          publisherName: '',
          buildRunUrl: '',
        }),
      ],
    }) as never,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const rowOf = (version: string) => screen.getByText(version).closest('tr') as HTMLElement;

describe('ReleasesPage', () => {
  it('lists every build CI registered, with every field', () => {
    renderWithProviders(<ReleasesPage />);
    expect(screen.getByText(/^Every merge to main builds a new version/)).toBeInTheDocument();
    const row = rowOf('1.4.0');
    expect(within(row).getByText('a1b2c3d4e5f6')).toBeInTheDocument();
    expect(within(row).getByText('2.0 KB')).toBeInTheDocument();
    expect(within(row).getByText('ffffffffffff')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Store listing' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(within(row).getByRole('link', { name: 'Open build log' })).toHaveAttribute(
      'href',
      'https://github.com/example/actions/runs/1',
    );
    const old = rowOf('1.3.0');
    expect(within(old).getAllByText('—')).toHaveLength(3);
    expect(
      within(old).queryByRole('button', { name: 'Download this build' }),
    ).not.toBeInTheDocument();
    expect(
      within(old).queryByRole('button', { name: 'Deprecate this build' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Approve and publish this build' }),
    ).not.toBeInTheDocument();
  });

  it('approves a build waiting for review on the channel chosen, Stable first', async () => {
    const user = userEvent.setup();
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult({
        maReleases: [
          makeRelease({ id: 'qa', version: '1.5.0', status: MaReleaseStatus.QaPending }),
          makeRelease({
            id: 'testing',
            version: '1.4.9',
            status: MaReleaseStatus.ReadyForInternalTesting,
          }),
        ],
      }) as never,
    );
    renderWithProviders(<ReleasesPage />);
    expect(
      within(rowOf('1.4.9')).getByRole('button', { name: 'Approve and publish this build' }),
    ).toBeInTheDocument();
    await user.click(
      within(rowOf('1.5.0')).getByRole('button', { name: 'Approve and publish this build' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Approve version 1.5.0')).toBeInTheDocument();
    const channel = within(dialog).getByRole('combobox', { name: /^Release channel/ });
    expect(channel).toHaveTextContent('Stable');
    await user.click(channel);
    await user.click(await screen.findByRole('option', { name: 'Beta' }));
    await user.click(within(dialog).getByRole('button', { name: 'Approve and publish' }));
    expect(approve).toHaveBeenCalledWith({
      variables: { id: 'qa', channel: MaReleaseChannel.Beta },
    });
    expect(vi.mocked(useMaApproveReleaseMutation).mock.lastCall?.[0]).toEqual({
      refetchQueries: ['MaLatestRelease', 'MaReleaseOverview'],
    });
    expect(await screen.findByText('Version 1.5.0 can now be downloaded')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the approval open when the server refuses it, and cancels', async () => {
    const user = userEvent.setup();
    approve.mockRejectedValue(new Error('Only a build waiting for approval can be approved'));
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult({
        maReleases: [makeRelease({ status: MaReleaseStatus.QaPending })],
      }) as never,
    );
    renderWithProviders(<ReleasesPage />);
    await user.click(screen.getByRole('button', { name: 'Approve and publish this build' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Approve and publish' }));
    expect(approve).toHaveBeenCalledWith({
      variables: { id: 'release-1', channel: MaReleaseChannel.Stable },
    });
    expect(
      await screen.findByText('Only a build waiting for approval can be approved'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('downloads a build', async () => {
    const assign = stubLocationAssign();
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(
      within(rowOf('1.4.0')).getByRole('button', { name: 'Download this build' }),
    );
    expect(link).toHaveBeenCalledWith({ variables: { id: 'release-1' } });
    expect(assign).toHaveBeenCalledWith('https://files.example.com/r.zip');
  });

  it('moves a build to another status with a note and a store listing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Change status' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(await within(dialog).findByText('Say why the status is changing')).toBeInTheDocument();

    const storeUrl = within(dialog).getByRole('textbox', {
      name: 'Chrome Web Store address (optional)',
    });
    await user.clear(storeUrl);
    await user.type(storeUrl, 'chromewebstore');
    await user.type(within(dialog).getByRole('textbox', { name: 'Note' }), 'Approved by Google');
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(
      await within(dialog).findByText('Enter the full store address, starting https://'),
    ).toBeInTheDocument();

    await user.clear(storeUrl);
    await user.type(storeUrl, 'https://chromewebstore.google.com/detail/x');
    await user.click(within(dialog).getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'In Review' }));
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(setStatus).toHaveBeenCalledWith({
      variables: {
        id: 'release-1',
        input: {
          status: MaReleaseStatus.InReview,
          note: 'Approved by Google',
          storeItemId: null,
          storeUrl: 'https://chromewebstore.google.com/detail/x',
        },
      },
    });
    expect(await screen.findByText('Release 1.4.0 updated')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the status form open when the server refuses, and cancels', async () => {
    const user = userEvent.setup();
    setStatus.mockRejectedValue(new Error('Release managers only'));
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Change status' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: 'Note' }), 'Ship it');
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(await screen.findByText('Release managers only')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Change status' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Close' }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the status history of a build', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Status history' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Version 1.4.0 history')).toBeInTheDocument();
    expect(within(dialog).getByText(/^Asha Rao · .* — Go$/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('deprecates a build only after a destructive confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleasesPage />);
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Deprecate this build' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(setStatus).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(within(rowOf('1.4.0')).getByRole('button', { name: 'Deprecate this build' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Deprecate version 1.4.0?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Deprecate' }));
    expect(setStatus).toHaveBeenCalledWith({
      variables: {
        id: 'release-1',
        input: { status: MaReleaseStatus.Deprecated, note: 'Deprecated from the releases page' },
      },
    });
    expect(await screen.findByText('Release 1.4.0 deprecated')).toBeInTheDocument();
  });

  it('shows the releases loading', () => {
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<ReleasesPage />);
    expect(screen.queryByText('No release available yet.')).not.toBeInTheDocument();
  });

  it('shows the releases failing with Retry, and none yet', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Releases down'), refetch }) as never,
    );
    const first = renderWithProviders(<ReleasesPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
    first.unmount();
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult({ maReleases: [] }, { refetch }) as never,
    );
    renderWithProviders(<ReleasesPage />);
    expect(screen.getByText('No release available yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
  });
});

describe('ReleasesPage — builds', () => {
  async function confirm(name: string) {
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  }

  it('opens a build on row click', async () => {
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(screen.getByText('1.4.0'));
    expect(screen.getByLabelText('location')).toHaveTextContent(
      '/ai/meeting-assistant/releases/release-1',
    );
  });

  it('deletes a build once confirmed, dropping it from the cache', async () => {
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(within(rowOf('1.4.0')).getByRole('button', { name: 'delete' }));
    expect(await screen.findByText('Delete version 1.4.0?')).toBeInTheDocument();
    await confirm('Delete');
    expect(remove).toHaveBeenCalledTimes(1);
    const call = remove.mock.calls[0][0];
    expect(call.variables).toEqual({ id: 'release-1' });
    const cache = { identify: vi.fn(() => 'MaRelease:release-1'), evict: vi.fn(), gc: vi.fn() };
    call.update(cache);
    expect(cache.evict).toHaveBeenCalledWith({ id: 'MaRelease:release-1' });
    expect(cache.gc).toHaveBeenCalled();
    expect(await screen.findByText('Release 1.4.0 deleted')).toBeInTheDocument();
  });

  it('keeps a build when the delete is cancelled', async () => {
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(within(rowOf('1.4.0')).getByRole('button', { name: 'delete' }));
    await confirm('Cancel');
    expect(remove).not.toHaveBeenCalled();
  });

  it('downloads the ticked builds that can be downloaded, together', async () => {
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    await userEvent.click(screen.getByRole('button', { name: 'Download selected' }));
    await vi.waitFor(() =>
      expect(downloadUrls).toHaveBeenCalledWith(['https://files.example.com/r.zip']),
    );
    expect(link).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Downloading 1 builds')).toBeInTheDocument();
  });

  it('offers no download when none of the ticked builds can be downloaded', async () => {
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(within(rowOf('1.3.0')).getByRole('checkbox', { name: 'Select row' }));
    expect(screen.getByRole('button', { name: 'Download selected' })).toBeDisabled();
  });

  it('reports a download link the server refuses, and skips one it does not give', async () => {
    link.mockReset().mockResolvedValueOnce({ data: undefined });
    renderWithProviders(<ReleasesPage />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    await userEvent.click(screen.getByRole('button', { name: 'Download selected' }));
    await vi.waitFor(() => expect(downloadUrls).toHaveBeenCalledWith([]));
    link.mockRejectedValueOnce(new Error('Not downloadable'));
    await userEvent.click(screen.getByRole('button', { name: 'Download selected' }));
    expect(await screen.findByText('Not downloadable')).toBeInTheDocument();
  });
});
