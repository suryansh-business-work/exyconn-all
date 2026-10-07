import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerDownloadPage } from '../../../../src/pages/download';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { PUBLISHED_AT, RELEASE } from './download.fixtures';

const gql = vi.hoisted(() => ({ release: vi.fn(), access: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerLatestReleaseQuery: (options: unknown) => gql.release(options),
  useMyTrackerAccessQuery: () => gql.access(),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `day of ${value}` }),
}));

const MAC_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1';
function releaseAnswer(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    data: { trackerLatestRelease: RELEASE },
    loading: false,
    error: undefined,
    ...overrides,
  };
}

function UrlProbe() {
  return <output data-testid="url">{useCurrentUrl()}</output>;
}

function renderPage(route = '/tracker/download') {
  return renderWithProviders(
    <>
      <TrackerDownloadPage />
      <UrlProbe />
    </>,
    { route },
  );
}

describe('TrackerDownloadPage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value: MAC_AGENT,
      configurable: true,
    });
    gql.release.mockReset().mockReturnValue(releaseAnswer());
    gql.access.mockReset().mockReturnValue({
      data: { myTrackerAccess: { isActive: true, consentedAt: null } },
      loading: false,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis.navigator, 'userAgent');
  });

  it('asks for the release fresh on every visit', () => {
    renderPage();

    expect(gql.release).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('holds skeletons under the header while the first release lookup runs', () => {
    gql.release.mockReturnValue({ data: undefined, loading: true, error: undefined });
    const { container } = renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Download Tracker' })).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows why the release could not be loaded', () => {
    gql.release.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Release lookup failed'),
    });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Release lookup failed');
  });

  it('says no build is published yet when the release is empty', () => {
    gql.release.mockReturnValue(releaseAnswer({ data: { trackerLatestRelease: null } }));
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No published tracker build yet. Ask Tech to run a build from Tech › Tracker Build.',
    );
  });

  it('keeps showing a cached release while it refreshes', () => {
    gql.release.mockReturnValue(releaseAnswer({ loading: true }));
    renderPage();

    expect(screen.getByRole('heading', { name: 'Exyconn Tracker for macOS' })).toBeInTheDocument();
  });

  it("opens on the visitor's own platform with that platform's newest build", () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Exyconn Tracker for macOS' })).toBeInTheDocument();
    expect(
      screen.getByText('We detected macOS, so this is the build for you.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Version 1.9.8')).toBeInTheDocument();
    expect(screen.getByText(`Released day of ${PUBLISHED_AT}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download for macOS' })).toHaveAttribute(
      'href',
      RELEASE.assets[0].url,
    );
    expect(screen.getByText('Installing on macOS')).toBeInTheDocument();
  });

  it('opens the platform named in the URL, on the release version when it has no file', () => {
    renderPage('/tracker/download?platform=android');

    expect(
      screen.getByText('Showing the Android build — switch platform on the right.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Version 1.9.9')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This release has no Android installer. Ask Tech to run a build that includes it.',
      ),
    ).toBeInTheDocument();
  });

  it('ignores an unknown platform in the URL', () => {
    renderPage('/tracker/download?platform=solaris');

    expect(screen.getByRole('heading', { name: 'Exyconn Tracker for macOS' })).toBeInTheDocument();
  });

  it('puts a picked platform in the URL and switches the page to it', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /^Windows/ }));

    expect(screen.getByTestId('url')).toHaveTextContent('/tracker/download?platform=windows');
    expect(
      screen.getByRole('heading', { name: 'Exyconn Tracker for Windows' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download for Windows' })).toBeInTheDocument();
  });

  it("reads the employee's readiness from their own access row", () => {
    renderPage();

    expect(screen.getByText('Your account may run the tracker.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The app shows a consent screen on first run; nothing is recorded until you accept it.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Checking…')).toBeNull();
  });

  it('treats a missing access row as no access and no consent, checking while it loads', () => {
    gql.access.mockReturnValue({ data: undefined, loading: true });
    renderPage();

    expect(screen.getByText('Checking…')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ask your manager to grant access — the app will refuse to sign you in until they do.',
      ),
    ).toBeInTheDocument();
  });

  it('marks consent done once the employee has accepted it in the app', () => {
    gql.access.mockReturnValue({
      data: { myTrackerAccess: { isActive: false, consentedAt: PUBLISHED_AT } },
      loading: false,
    });
    renderPage();

    expect(screen.getByText('You have accepted what the app records.')).toBeInTheDocument();
  });
});
