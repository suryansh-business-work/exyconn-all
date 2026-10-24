import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { BuildDetailsPage } from '../../../../src/pages/builds/BuildDetailsPage';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { FULL, PHONE } from './builds.fixtures';

const state = vi.hoisted(() => ({ releases: vi.fn(), download: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerBuildReleasesQuery: state.releases,
}));
vi.mock('../../../../src/pages/builds/downloadFiles', () => ({ downloadFiles: state.download }));

function Page() {
  return (
    <>
      <BuildDetailsPage />
      <output aria-label="url">{useCurrentUrl()}</output>
    </>
  );
}

const renderPage = (id: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/tracker/builds/release/:id" element={<Page />} />
      <Route path="*" element={<output aria-label="url">{'elsewhere'}</output>} />
    </Routes>,
    { route: `/tracker/builds/release/${id}` },
  );

const answer = (result: Record<string, unknown>) =>
  state.releases.mockReturnValue({ data: undefined, loading: false, ...result });

describe('BuildDetailsPage', () => {
  beforeEach(() => {
    state.releases.mockReset();
    state.download.mockReset();
  });

  it('offers every installer of the build, platform by platform', async () => {
    answer({ data: { trackerBuildReleases: [FULL, PHONE] } });
    renderPage('11');
    expect(state.releases).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
    expect(screen.getByRole('heading', { name: 'Build 1.4.0' })).toBeInTheDocument();
    for (const platform of ['Windows', 'macOS', 'Linux', 'Android', 'iOS']) {
      expect(screen.getByRole('heading', { name: platform })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Download APK' })).toHaveAttribute(
      'href',
      'https://dl.test/Tracker-1.4.0.apk',
    );
    expect(screen.getByRole('link', { name: 'Download AAB' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open on GitHub' })).toHaveAttribute(
      'href',
      'https://github.test/releases/1.4.0',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Download all' }));
    expect(state.download).toHaveBeenCalledWith(FULL.assets.map((a) => a.url));
  });

  it('says which platforms a partial build has nothing for', () => {
    answer({ data: { trackerBuildReleases: [FULL, PHONE] } });
    renderPage('10');
    const windows = screen.getByRole('heading', { name: 'Windows' }).closest('div')
      ?.parentElement as HTMLElement;
    expect(within(windows).getByText(/This release has no Windows installer/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download APK' })).toBeInTheDocument();
  });

  it('waits while the builds load', () => {
    answer({ loading: true });
    const { container } = renderPage('11');
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('says a build is gone, and why the list failed', () => {
    answer({ data: { trackerBuildReleases: [PHONE] } });
    const { unmount } = renderPage('11');
    expect(
      screen.getByText('This build no longer exists. It may have been deleted.'),
    ).toBeInTheDocument();
    unmount();
    answer({ error: new Error('GitHub token expired') });
    renderPage('11');
    expect(screen.getByText('GitHub token expired')).toBeInTheDocument();
  });

  it('goes back to the published builds', async () => {
    answer({ data: { trackerBuildReleases: [FULL] } });
    renderPage('11');
    await userEvent.click(screen.getByRole('button', { name: 'Back to Builds' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('elsewhere');
  });
});
