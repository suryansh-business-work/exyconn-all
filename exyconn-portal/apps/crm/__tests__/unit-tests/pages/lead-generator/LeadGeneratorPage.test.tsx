import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LeadGeneratorPage } from '../../../../src/pages/lead-generator/LeadGeneratorPage';
import { renderWithProviders } from '../../test-utils';
import { press } from '../../form-helpers';

interface ConfigResult {
  data?: { googleMapsClientConfig: { placesReady: boolean; browserKey?: string | null } };
  loading: boolean;
  error?: Error;
  refetch: ReturnType<typeof vi.fn>;
}

const config = vi.hoisted(() => ({ result: null as unknown, options: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGoogleMapsClientConfigQuery: (options: unknown) => {
    config.options = options;
    return config.result;
  },
}));

// The workspace has its own tests; here it only shows which key it was given.
vi.mock('../../../../src/pages/lead-generator/LeadWorkspace', () => ({
  LeadWorkspace: ({ browserKey }: Readonly<{ browserKey: string | null }>) => (
    <div data-testid="workspace">{browserKey ?? 'no map key'}</div>
  ),
}));

function answer(result: Partial<ConfigResult>) {
  const full: ConfigResult = { loading: false, refetch: vi.fn().mockResolvedValue({}), ...result };
  config.result = full;
  return full;
}

const ready = (browserKey?: string | null) => ({
  googleMapsClientConfig: { placesReady: true, browserKey },
});

describe('LeadGeneratorPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the workspace with the Maps key once Places is set up', () => {
    answer({ data: ready('maps-key') });
    renderWithProviders(<LeadGeneratorPage />);

    expect(screen.getByRole('heading', { name: 'Google Business' })).toBeInTheDocument();
    expect(screen.getByTestId('workspace')).toHaveTextContent('maps-key');
    expect(config.options).toEqual({ fetchPolicy: 'cache-and-network' });
  });

  it('opens the workspace without a map when there is no Maps key', () => {
    answer({ data: ready() });
    renderWithProviders(<LeadGeneratorPage />);

    expect(screen.getByTestId('workspace')).toHaveTextContent('no map key');
  });

  it('keeps showing the workspace when a refresh fails after it loaded', () => {
    answer({ data: ready(null), error: new Error('offline') });
    renderWithProviders(<LeadGeneratorPage />);

    expect(screen.getByTestId('workspace')).toHaveTextContent('no map key');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks Tech to set up Places when it is not configured', () => {
    answer({ data: { googleMapsClientConfig: { placesReady: false } } });
    renderWithProviders(<LeadGeneratorPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Google Places is not set up yet.');
    expect(
      screen.getByRole('link', { name: 'Tech > Environment Variables > Google Maps' }),
    ).toHaveAttribute('href', expect.stringContaining('/tech/environment-variables/google-maps'));
    expect(screen.queryByTestId('workspace')).not.toBeInTheDocument();
  });

  it('shows a skeleton while the config loads', () => {
    answer({ loading: true });
    renderWithProviders(<LeadGeneratorPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading the lead generator');
    expect(screen.queryByTestId('workspace')).not.toBeInTheDocument();
  });

  it('shows the error and retries on request', async () => {
    const result = answer({ error: new Error('Network down') });
    renderWithProviders(<LeadGeneratorPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    await press('Retry');

    expect(result.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a retry that fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('still down');
    answer({ error: new Error('Network down'), refetch: vi.fn().mockRejectedValue(failure) });
    renderWithProviders(<LeadGeneratorPage />);

    await press('Retry');

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: reloading the Google Maps config', failure),
    );
  });
});
