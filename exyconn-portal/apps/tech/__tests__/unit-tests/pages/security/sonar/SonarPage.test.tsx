import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SonarOverviewState } from '@exyconn/shell/graphql/generated';
import { SonarPage } from '../../../../../src/pages/security';
import { HOST, overview } from '../../../../../src/pages/security/sonar/SonarPage.fixtures';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn(), notify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSonarOverviewQuery: gql.query,
  useSonarIssuesQuery: () => ({ data: undefined, loading: false }),
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../use-settings.mock')).settingsModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));

function answer(result: Record<string, unknown>) {
  gql.query.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch, ...result });
}

const refreshButton = () => screen.getByRole('button', { name: 'Refresh' });

describe('SonarPage', () => {
  beforeEach(() => {
    gql.query.mockReset();
    gql.refetch.mockReset().mockResolvedValue({});
    gql.notify.mockReset();
  });

  it('reads the cached overview and shows progress until it arrives', () => {
    answer({ loading: true });
    renderWithProviders(<SonarPage />);
    expect(gql.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('progressbar', { name: 'Reading SonarQube' })).toBeInTheDocument();
    expect(refreshButton()).toBeDisabled();
  });

  it('shows the dashboard for a project SonarQube answered for', () => {
    answer({ data: overview(SonarOverviewState.Ok) });
    renderWithProviders(<SonarPage />);
    expect(
      screen.getByText('exyconn on SonarCloud, read at(2026-10-04T08:00:00.000Z)'),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open in SonarQube' });
    expect(link).toHaveAttribute('href', `${HOST}/dashboard?id=exyconn`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Quality gate failed')).toBeInTheDocument();
    expect(screen.getByText('Bugs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Open issues (41)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent analyses' })).toBeInTheDocument();
    expect(
      screen.queryByRole('progressbar', { name: 'Reading SonarQube' }),
    ).not.toBeInTheDocument();
    expect(refreshButton()).toBeEnabled();
  });

  it('leaves out the gate and measures SonarQube did not send', () => {
    const data = overview(SonarOverviewState.Ok);
    answer({
      data: { sonarOverview: { ...data.sonarOverview, qualityGate: null, metrics: null } },
    });
    renderWithProviders(<SonarPage />);
    expect(screen.queryByText(/Quality gate/)).not.toBeInTheDocument();
    expect(screen.queryByText('Bugs')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent analyses' })).toBeInTheDocument();
  });

  it('invites setting SonarQube up instead of a dashboard', () => {
    answer({ data: overview(SonarOverviewState.NotConfigured) });
    renderWithProviders(<SonarPage />);
    expect(screen.getByText('SonarQube is not set up')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Open issues/ })).not.toBeInTheDocument();
  });

  it('gives the reason the configured server could not be read', () => {
    answer({ data: overview(SonarOverviewState.Unauthorized, 'SonarQube rejected the token.') });
    renderWithProviders(<SonarPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('SonarQube rejected the token.');
  });

  it('says why the overview could not be read', () => {
    answer({ error: new Error('Forbidden') });
    const { unmount } = renderWithProviders(<SonarPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Forbidden');
    unmount();
    answer({ error: { message: 'not an Error' } });
    renderWithProviders(<SonarPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('SonarQube could not be read.');
  });

  it('asks SonarQube again on Refresh', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.refetch.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    answer({ data: overview(SonarOverviewState.Ok) });
    renderWithProviders(<SonarPage />);
    await userEvent.click(refreshButton());
    expect(gql.refetch).toHaveBeenCalledWith({ refresh: true });
    expect(screen.getByRole('button', { name: 'Reading…' })).toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Reading SonarQube' })).toBeInTheDocument();
    finish({});
    expect(await screen.findByRole('button', { name: 'Refresh' })).toBeEnabled();
    expect(gql.notify).not.toHaveBeenCalled();
  });

  it('reports a refresh that fails', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('Timed out')).mockRejectedValueOnce('nope');
    answer({ data: overview(SonarOverviewState.Ok) });
    renderWithProviders(<SonarPage />);
    await userEvent.click(refreshButton());
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Timed out', 'error'));
    await waitFor(() => expect(refreshButton()).toBeEnabled());
    await userEvent.click(refreshButton());
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('SonarQube could not be read.', 'error'),
    );
  });
});
