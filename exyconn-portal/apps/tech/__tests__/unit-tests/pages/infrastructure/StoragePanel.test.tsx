import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { format } from 'date-fns';
import { formatBytes } from '@exyconn/shell/utils/file';
import { StoragePanel } from '../../../../src/pages/infrastructure/StoragePanel';
import { renderWithProviders } from '../../test-utils';
import { opsTable, tableProps } from '../ops-table.stub';

const gql = vi.hoisted(() => ({ storage: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDockerStorageQuery: gql.storage,
}));
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('../ops-table.stub')).dataTableModule(),
);

const GB = 1024 * 1024 * 1024;

const STORAGE = {
  usage: { layersBytes: 3 * GB, containersBytes: 2048, volumesBytes: 5 * GB, buildCacheBytes: 0 },
  images: [
    {
      id: 'img-1',
      repoTags: ['ghcr.io/exyconn/portal-server:sha-1', 'ghcr.io/exyconn/portal-server:latest'],
      sizeBytes: 300 * 1024 * 1024,
      createdAt: '2026-09-30T12:00:00.000Z',
      containers: 1,
    },
    {
      id: 'img-2',
      repoTags: [],
      sizeBytes: 512,
      createdAt: '2026-09-01T12:00:00.000Z',
      containers: 0,
    },
    {
      id: 'img-3',
      repoTags: ['mongo:7'],
      sizeBytes: GB,
      createdAt: '2026-08-01T12:00:00.000Z',
      containers: 3,
    },
  ],
};

const answer = (overrides: object = {}) => ({
  data: { dockerStorage: STORAGE },
  loading: false,
  error: undefined,
  refetch: gql.refetch,
  ...overrides,
});

function tileFor(label: string): HTMLElement {
  const tile = screen.getByText(label).parentElement?.parentElement;
  if (!tile) {
    throw new Error(`No tile for ${label}`);
  }
  return tile;
}

describe('StoragePanel', () => {
  beforeEach(() => {
    opsTable.props = null;
    gql.storage.mockReset().mockReturnValue(answer());
  });

  it('shows the error the read failed with instead of the panel', () => {
    gql.storage.mockReturnValue(answer({ data: undefined, error: new Error('du timed out') }));
    renderWithProviders(<StoragePanel />);

    expect(screen.getByRole('alert')).toHaveTextContent('du timed out');
    expect(opsTable.props).toBeNull();
  });

  it('splits the engine’s disk use into layers, writes, volumes and build cache', () => {
    renderWithProviders(<StoragePanel />);

    expect(gql.storage).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(tileFor('Image layers')).toHaveTextContent(formatBytes(3 * GB));
    expect(tileFor('Container writes')).toHaveTextContent('2.0 KB');
    expect(tileFor('Volumes')).toHaveTextContent(formatBytes(5 * GB));
    expect(tileFor('Build cache')).toHaveTextContent('0 B');
    expect(tableProps().onRefresh).toBe(gql.refetch);
  });

  it('lists every image with its tags, size, build date and users', () => {
    renderWithProviders(<StoragePanel />);

    expect(screen.getByTestId('img-1-repoTags')).toHaveTextContent(
      'ghcr.io/exyconn/portal-server:sha-1, ghcr.io/exyconn/portal-server:latest',
    );
    expect(screen.getByTestId('img-1-sizeBytes')).toHaveTextContent('300.0 MB');
    expect(screen.getByTestId('img-1-createdAt')).toHaveTextContent(
      format(new Date('2026-09-30T12:00:00.000Z'), 'PP'),
    );
    expect(screen.getByTestId('img-1-containers')).toHaveTextContent('1 container');
    expect(screen.getByTestId('img-2-repoTags')).toHaveTextContent('<untagged>');
    expect(screen.getByTestId('img-2-containers')).toHaveTextContent('unused');
    expect(screen.getByTestId('img-3-containers')).toHaveTextContent('3 containers');
  });

  it('holds placeholders in the tiles until the first answer arrives', () => {
    gql.storage.mockReturnValue(answer({ data: undefined, loading: true }));
    renderWithProviders(<StoragePanel />);

    expect(screen.queryByText('0 B')).not.toBeInTheDocument();
    expect(screen.getByText('No images on this host.')).toBeInTheDocument();
    expect(tableProps().loading).toBe(true);
  });

  it('shows zeros once an empty host has answered', () => {
    gql.storage.mockReturnValue(answer({ data: undefined, loading: false }));
    renderWithProviders(<StoragePanel />);

    expect(screen.getAllByText('0 B')).toHaveLength(4);
  });
});
