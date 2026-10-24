import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { BuildReleasesTab } from '../../../../src/pages/builds/BuildReleasesTab';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { FULL, PHONE } from './builds.fixtures';

const state = vi.hoisted(() => ({
  releases: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
  download: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerBuildReleasesQuery: state.releases,
  useDeleteTrackerBuildReleaseMutation: () => [state.remove],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => state.notify,
}));
vi.mock('../../../../src/pages/builds/downloadFiles', () => ({ downloadFiles: state.download }));

function answer(result: Record<string, unknown>) {
  state.releases.mockReturnValue({
    data: undefined,
    loading: false,
    refetch: state.refetch,
    ...result,
  });
}

function Tab() {
  return (
    <>
      <BuildReleasesTab />
      <output aria-label="url">{useCurrentUrl()}</output>
    </>
  );
}

const renderTab = () =>
  renderWithProviders(
    <Routes>
      <Route path="*" element={<Tab />} />
    </Routes>,
    { route: '/tracker/builds/published' },
  );

const rowOf = (version: string) => screen.getByText(version).closest('tr') as HTMLElement;

async function confirmDialog(name: string) {
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

describe('BuildReleasesTab', () => {
  beforeEach(() => {
    state.releases.mockReset();
    state.remove.mockReset().mockResolvedValue({ data: { deleteTrackerBuildRelease: true } });
    state.refetch.mockReset().mockResolvedValue({});
    state.download.mockReset();
    state.notify.mockReset();
  });

  it('lists each build with its platforms and total downloads', () => {
    answer({ data: { trackerBuildReleases: [FULL, PHONE] } });
    renderTab();
    expect(state.releases).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(
      within(rowOf('1.4.0')).getByText('Windows, macOS, Linux, Android, iOS'),
    ).toBeInTheDocument();
    expect(within(rowOf('1.4.0')).getByText('12')).toBeInTheDocument();
    expect(within(rowOf('1.3.9')).getByText('Android')).toBeInTheDocument();
  });

  it('says when nothing is published, and why a list failed', () => {
    answer({ data: { trackerBuildReleases: [] } });
    const { unmount } = renderTab();
    expect(screen.getByText('No builds published yet.')).toBeInTheDocument();
    unmount();
    answer({ error: new Error('GitHub token expired') });
    renderTab();
    expect(screen.getByText('GitHub token expired')).toBeInTheDocument();
  });

  it('opens a build on row click', async () => {
    answer({ data: { trackerBuildReleases: [FULL] } });
    renderTab();
    await userEvent.click(screen.getByText('1.4.0'));
    expect(screen.getByLabelText('url')).toHaveTextContent('/tracker/builds/release/11');
  });

  it('downloads one build from its row, and the ticked builds together', async () => {
    answer({ data: { trackerBuildReleases: [FULL, PHONE] } });
    renderTab();
    await userEvent.click(
      within(rowOf('1.3.9')).getByRole('button', { name: 'Download every installer' }),
    );
    expect(state.download).toHaveBeenCalledWith(['https://dl.test/Tracker-1.3.9.apk']);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    await userEvent.click(screen.getByRole('button', { name: 'Download selected' }));
    expect(state.download).toHaveBeenLastCalledWith([
      ...FULL.assets.map((a) => a.url),
      'https://dl.test/Tracker-1.3.9.apk',
    ]);
  });

  it('deletes a build once confirmed and drops it from the cache', async () => {
    answer({ data: { trackerBuildReleases: [FULL] } });
    renderTab();
    await userEvent.click(within(rowOf('1.4.0')).getByRole('button', { name: 'delete' }));
    await confirmDialog('Delete');
    await waitFor(() => expect(state.remove).toHaveBeenCalledTimes(1));
    const call = state.remove.mock.calls[0][0];
    expect(call.variables).toEqual({ id: '11' });
    const cache = { identify: vi.fn(() => 'TrackerBuildRelease:11'), evict: vi.fn(), gc: vi.fn() };
    call.update(cache);
    expect(cache.evict).toHaveBeenCalledWith({ id: 'TrackerBuildRelease:11' });
    expect(cache.gc).toHaveBeenCalled();
    expect(state.notify).toHaveBeenCalledWith('Build {version} deleted', 'success', {
      version: '1.4.0',
    });
  });

  it('keeps a build when the confirm is cancelled, and reports a refused delete', async () => {
    answer({ data: { trackerBuildReleases: [FULL] } });
    renderTab();
    await userEvent.click(within(rowOf('1.4.0')).getByRole('button', { name: 'delete' }));
    await confirmDialog('Cancel');
    expect(state.remove).not.toHaveBeenCalled();

    state.remove.mockRejectedValueOnce(new Error('Not a tracker build')).mockRejectedValueOnce({});
    await userEvent.click(within(rowOf('1.4.0')).getByRole('button', { name: 'delete' }));
    await confirmDialog('Delete');
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith('Not a tracker build', 'error'));
    await userEvent.click(within(rowOf('1.4.0')).getByRole('button', { name: 'delete' }));
    await confirmDialog('Delete');
    await waitFor(() =>
      expect(state.notify).toHaveBeenCalledWith('Could not delete the build', 'error'),
    );
  });
});
