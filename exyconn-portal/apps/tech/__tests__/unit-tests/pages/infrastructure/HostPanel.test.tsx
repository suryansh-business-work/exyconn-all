import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { format } from 'date-fns';
import { formatBytes } from '@exyconn/shell/utils/file';
import { HostPanel } from '../../../../src/pages/infrastructure/HostPanel';
import { renderWithProviders } from '../../test-utils';
import { overview } from './infra.fixtures';

const gql = vi.hoisted(() => ({ overview: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useInfrastructureOverviewQuery: gql.overview,
}));

const MB = 1024 * 1024;

/** A stat tile: its label sits in a header row, its figure below that row. */
function tileFor(label: string): HTMLElement {
  const tile = screen.getByText(label).parentElement?.parentElement;
  if (!tile) {
    throw new Error(`No tile for ${label}`);
  }
  return tile;
}

/** A detail row: label and value side by side. */
function factFor(label: string): HTMLElement {
  const row = screen.getByText(label).parentElement;
  if (!row) {
    throw new Error(`No row for ${label}`);
  }
  return row;
}

describe('HostPanel', () => {
  beforeEach(() => {
    gql.overview.mockReset().mockReturnValue({
      data: { infrastructureOverview: overview() },
      loading: false,
      error: undefined,
    });
  });

  it('polls the host in the background every thirty seconds', () => {
    renderWithProviders(<HostPanel />);

    expect(gql.overview).toHaveBeenCalledWith({
      fetchPolicy: 'cache-and-network',
      pollInterval: 30_000,
      context: { background: true },
    });
  });

  it('shows the error the query failed with', () => {
    gql.overview.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('socket hang up'),
    });
    renderWithProviders(<HostPanel />);

    expect(screen.getByRole('alert')).toHaveTextContent('socket hang up');
  });

  it('shows a spinner until the first answer, and nothing when there is none', () => {
    gql.overview.mockReturnValue({ data: undefined, loading: true, error: undefined });
    const { unmount } = renderWithProviders(<HostPanel />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    unmount();

    gql.overview.mockReturnValue({ data: undefined, loading: false, error: undefined });
    renderWithProviders(<HostPanel />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('Containers running')).not.toBeInTheDocument();
  });

  it('counts containers, images and CPUs in the stat tiles', () => {
    renderWithProviders(<HostPanel />);

    expect(tileFor('Containers running')).toHaveTextContent('12');
    expect(tileFor('Containers stopped')).toHaveTextContent('3');
    expect(tileFor('Images on host')).toHaveTextContent('21');
    expect(screen.getAllByText('6')).toHaveLength(2);
    expect(screen.queryByText(/not reachable/)).not.toBeInTheDocument();
  });

  it('describes the Docker host, the API process and the database', () => {
    renderWithProviders(<HostPanel />);

    expect(factFor('Host name')).toHaveTextContent('vps-1');
    expect(factFor('Architecture')).toHaveTextContent('linux/x86_64');
    expect(factFor('Memory')).toHaveTextContent(formatBytes(8 * 1024 * MB));
    expect(factFor('Host clock')).toHaveTextContent(
      format(new Date('2026-10-07T10:00:00.000Z'), 'PPpp'),
    );
    expect(factFor('Platform')).toHaveTextContent('linux/x64');
    expect(factFor('Started')).toHaveTextContent(
      format(new Date('2026-10-07T08:58:00.000Z'), 'PPpp'),
    );
    expect(factFor('Heap')).toHaveTextContent('100.0 MB / 150.0 MB');
    expect(factFor('Load average')).toHaveTextContent('0.50 1.25 2.00');
    expect(screen.getByText('1h 2m')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    expect(factFor('Connections')).toHaveTextContent('9 in use / 811 free');
    expect(factFor('Documents')).toHaveTextContent((12_345).toLocaleString());
    expect(screen.getByText('1d 1h 0m')).toBeInTheDocument();
    expect(factFor('Index size')).toHaveTextContent('512 B');
  });

  it('warns when the engine is unreachable and dashes every value it could not read', () => {
    const base = overview();
    gql.overview.mockReturnValue({
      data: {
        infrastructureOverview: {
          ...base,
          docker: {
            ...base.docker,
            reachable: false,
            error: 'Docker socket proxy is not reachable',
            name: '',
            serverVersion: '',
            apiVersion: '',
            operatingSystem: '',
            kernelVersion: '',
            storageDriver: '',
            loggingDriver: '',
            dockerRootDir: '',
            serverTime: null,
          },
          database: { ...base.database, host: '', version: '' },
        },
      },
      loading: false,
      error: undefined,
    });
    renderWithProviders(<HostPanel />);

    expect(screen.getByRole('alert')).toHaveTextContent('Docker socket proxy is not reachable');
    expect(screen.getAllByText('—')).toHaveLength(11);
    expect(factFor('Host clock')).toHaveTextContent('—');
  });
});
