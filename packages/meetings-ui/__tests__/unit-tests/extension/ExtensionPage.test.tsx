import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMaDisconnectGoogleMutation,
  useMaGoogleConnectionQuery,
  useMaLatestReleaseQuery,
  useMaMyExtensionSessionsQuery,
  useMaReleaseDownloadLinkMutation,
  useMaReleasesQuery,
  useMaRevokeExtensionSessionMutation,
  useMaStartGoogleConnectMutation,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ExtensionPage } from '../../../src/extension/ExtensionPage';
import { STARTED, makeRelease } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders, stubLocationAssign } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaLatestReleaseQuery: vi.fn(),
  useMaReleasesQuery: vi.fn(),
  useMaReleaseDownloadLinkMutation: vi.fn(),
  useMaMyExtensionSessionsQuery: vi.fn(),
  useMaRevokeExtensionSessionMutation: vi.fn(),
  useMaGoogleConnectionQuery: vi.fn(),
  useMaStartGoogleConnectMutation: vi.fn(),
  useMaDisconnectGoogleMutation: vi.fn(),
}));

const run = { link: vi.fn(), revoke: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
const latestRefetch = vi.fn();
const SESSION = {
  id: 's1',
  deviceLabel: 'Chrome on macOS',
  extensionVersion: '1.4.0',
  createdAt: STARTED,
  lastSeenAt: null,
  expiresAt: '2026-11-20T09:00:00.000Z',
  revokedAt: null,
  current: true,
};
const CONNECTION = {
  configured: true,
  connected: false,
  email: null,
  connectedAt: null,
  lastError: '',
};

function connection(patch: Partial<typeof CONNECTION> | Record<string, unknown> = {}) {
  vi.mocked(useMaGoogleConnectionQuery).mockReturnValue(
    queryResult({ maGoogleConnection: { ...CONNECTION, ...patch } }) as never,
  );
}

beforeEach(() => {
  for (const fn of Object.values(run)) {
    fn.mockReset().mockResolvedValue({ data: {} });
  }
  latestRefetch
    .mockReset()
    .mockResolvedValue({ data: { maLatestRelease: makeRelease({ version: '1.5.0' }) } });
  vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
    queryResult({ maLatestRelease: makeRelease() }, { refetch: latestRefetch }) as never,
  );
  vi.mocked(useMaReleasesQuery).mockReturnValue(
    queryResult({
      maReleases: [makeRelease(), makeRelease({ id: 'r0', version: '1.3.0', releaseNotes: '' })],
    }) as never,
  );
  vi.mocked(useMaReleaseDownloadLinkMutation).mockReturnValue(mutationTuple(run.link) as never);
  vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
    queryResult({
      maMyExtensionSessions: [
        SESSION,
        {
          ...SESSION,
          id: 's2',
          deviceLabel: 'Old laptop',
          lastSeenAt: STARTED,
          revokedAt: STARTED,
        },
      ],
    }) as never,
  );
  vi.mocked(useMaRevokeExtensionSessionMutation).mockReturnValue(
    mutationTuple(run.revoke) as never,
  );
  vi.mocked(useMaStartGoogleConnectMutation).mockReturnValue(mutationTuple(run.connect) as never);
  vi.mocked(useMaDisconnectGoogleMutation).mockReturnValue(mutationTuple(run.disconnect) as never);
  connection();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ExtensionPage — the release', () => {
  it('describes the newest release and keeps the store button off until a listing exists', () => {
    renderWithProviders(<ExtensionPage />);
    expect(
      screen.getByRole('heading', { name: 'Google Meet AI Assistant', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Current version').nextElementSibling).toHaveTextContent('1.4.0');
    expect(screen.getByText('Chrome 120 or later')).toBeInTheDocument();
    expect(screen.getByText('f'.repeat(64))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Install from Chrome Web Store' })).toBeDisabled();
  });

  it('links the store button to the real listing once there is one', () => {
    const storeUrl = 'https://chromewebstore.google.com/detail/item';
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult({ maLatestRelease: makeRelease({ storeUrl }) }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByRole('link', { name: 'Install from Chrome Web Store' })).toHaveAttribute(
      'href',
      storeUrl,
    );
  });

  it('downloads the internal ZIP through a short-lived link and gives its checksum', async () => {
    const assign = stubLocationAssign();
    run.link.mockResolvedValue({
      data: {
        maReleaseDownloadLink: {
          url: 'https://files.example.com/x.zip',
          expiresAt: STARTED,
          fileName: 'x.zip',
          sha256: 'abc',
        },
      },
    });
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Download internal ZIP' }));
    expect(run.link).toHaveBeenCalledWith({ variables: { id: 'release-1' } });
    expect(assign).toHaveBeenCalledWith('https://files.example.com/x.zip');
    expect(await screen.findByText('Downloading x.zip. Its SHA-256 is abc')).toBeInTheDocument();
  });

  it('says why a download could not start, and stays put without a link', async () => {
    const assign = stubLocationAssign();
    run.link.mockRejectedValueOnce(new Error('Release withdrawn'));
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Download internal ZIP' }));
    expect(await screen.findByText('Release withdrawn')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download internal ZIP' }));
    expect(assign).not.toHaveBeenCalled();
  });

  it('walks through installing an unpacked extension, with the address as copyable text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'Installation guide' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/cannot install a ZIP or CRX file in one click/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Open chrome://extensions in Chrome.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(6);
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the changelog of every release', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    expect(vi.mocked(useMaReleasesQuery).mock.lastCall?.[0]).toMatchObject({ skip: true });
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Faster transcripts')).toBeInTheDocument();
    expect(within(dialog).getByText('No release notes.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
  });

  it('shows the changelog empty, loading and failing', async () => {
    const user = userEvent.setup();
    vi.mocked(useMaReleasesQuery).mockReturnValue(queryResult({ maReleases: [] }) as never);
    const first = renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    expect(await screen.findByText('No release available yet.')).toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    expect(screen.queryByText('Faster transcripts')).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaReleasesQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Changelog down'), refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'View changelog' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Retry' }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it('checks for updates and says what it found', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'Check for updates' }));
    expect(await screen.findByText('The newest release is version 1.5.0')).toBeInTheDocument();
    latestRefetch.mockResolvedValueOnce({ data: { maLatestRelease: null } });
    await user.click(screen.getByRole('button', { name: 'Check for updates' }));
    expect(await screen.findByText('No release available yet')).toBeInTheDocument();
  });

  it('logs a failed update check, leaving the error to the query', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    latestRefetch.mockRejectedValueOnce(new Error('offline'));
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Check for updates' }));
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Checking for extension updates failed', expect.any(Error)),
    );
  });

  it('says when no release is available yet, and shows loading and errors', async () => {
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult({ maLatestRelease: null }) as never,
    );
    const first = renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('No release available yet')).toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<ExtensionPage />);
    expect(screen.queryByText('Current version')).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaLatestReleaseQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Releases down'), refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    const alert = screen.getByText('Releases down').closest('[role="alert"]') as HTMLElement;
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('ExtensionPage — signed-in browsers', () => {
  it('lists each browser and signs one out after a destructive confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
    const signOut = screen.getAllByRole('button', { name: 'Sign out this browser' });
    expect(signOut).toHaveLength(1);
    await user.click(signOut[0]);
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'The extension on Chrome on macOS stops working until it is signed in again.',
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    expect(run.revoke).toHaveBeenCalledWith({
      variables: { id: 's1' },
      refetchQueries: ['MaMyExtensionSessions'],
    });
    expect(await screen.findByText('Extension signed out')).toBeInTheDocument();
  });

  it('does nothing when signing out is cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExtensionPage />);
    await user.click(screen.getByRole('button', { name: 'Sign out this browser' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(run.revoke).not.toHaveBeenCalled();
  });

  it('shows the sessions loading', () => {
    vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.queryByText('Chrome on macOS')).not.toBeInTheDocument();
  });

  it('shows the sessions failing with Retry, and none yet', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Sessions down'), refetch }) as never,
    );
    const first = renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]);
    expect(refetch).toHaveBeenCalled();
    first.unmount();
    vi.mocked(useMaMyExtensionSessionsQuery).mockReturnValue(
      queryResult({ maMyExtensionSessions: [] }, { refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('The extension is not signed in anywhere yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
  });
});

describe('ExtensionPage — Google Meet connection', () => {
  it('starts the Google sign-in and comes back to this page', async () => {
    const assign = stubLocationAssign();
    run.connect.mockResolvedValue({
      data: { maStartGoogleConnect: 'https://accounts.google.com/o/oauth2' },
    });
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Connect Google Meet' }));
    expect(run.connect).toHaveBeenCalledWith({
      variables: { returnTo: 'http://localhost/current' },
    });
    expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2');
  });

  it("says why the sign-in could not start, and stays put without Google's address", async () => {
    const assign = stubLocationAssign();
    run.connect.mockRejectedValueOnce(new Error('Google is not configured'));
    renderWithProviders(<ExtensionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Connect Google Meet' }));
    expect(await screen.findByText('Google is not configured')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Connect Google Meet' }));
    expect(assign).not.toHaveBeenCalled();
  });

  it('shows the connected account and its last error, and disconnects after confirming', async () => {
    const user = userEvent.setup();
    connection({
      connected: true,
      email: 'asha@example.com',
      connectedAt: STARTED,
      lastError: 'Token expired once',
    });
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText(/^Connected as asha@example.com since /)).toBeInTheDocument();
    expect(screen.getByText('Token expired once')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Disconnect' }),
    );
    expect(run.disconnect).toHaveBeenCalled();
    expect(await screen.findByText('Google Meet disconnected')).toBeInTheDocument();
  });

  it('keeps the connection when disconnecting is cancelled, and tolerates missing details', async () => {
    const user = userEvent.setup();
    connection({ connected: true });
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('Connected as your Google account')).toBeInTheDocument();
    cleanup();
    connection({ connected: true, connectedAt: STARTED });
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText(/^Connected as your Google account since /)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(run.disconnect).not.toHaveBeenCalled();
  });

  it('says when Google Meet is not configured, and shows loading and errors', async () => {
    connection({ configured: false });
    const first = renderWithProviders(<ExtensionPage />);
    expect(
      screen.getByText('Google Meet is not configured for this company yet.'),
    ).toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaGoogleConnectionQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<ExtensionPage />);
    expect(screen.queryByRole('button', { name: 'Connect Google Meet' })).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaGoogleConnectionQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Connection lookup failed'), refetch }) as never,
    );
    renderWithProviders(<ExtensionPage />);
    expect(screen.getByText('Connection lookup failed')).toBeInTheDocument();
    const alert = screen
      .getByText('Connection lookup failed')
      .closest('[role="alert"]') as HTMLElement;
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
