import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetworkStatus } from '@apollo/client';
import { ContainersPanel } from '../../../../src/pages/infrastructure/ContainersPanel';
import { renderWithProviders } from '../../test-utils';
import { opsTable, tableProps } from '../ops-table.stub';

const gql = vi.hoisted(() => ({ containers: vi.fn(), refetch: vi.fn() }));
const dialog = vi.hoisted(() => ({
  props: null as null | { containerId: string | null; name: string; onClose: () => void },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDockerContainersQuery: gql.containers,
}));
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('../ops-table.stub')).dataTableModule(),
);
vi.mock('../../../../src/pages/infrastructure/ContainerDetailDialog', () => ({
  ContainerDetailDialog: (props: NonNullable<typeof dialog.props>) => {
    dialog.props = props;
    return null;
  },
}));

const CONTAINERS = [
  {
    id: 'c-1',
    name: 'portal-server',
    image: 'ghcr.io/exyconn/portal-server',
    imageTag: 'sha-4f2a9c1',
    state: 'RUNNING',
    status: 'Up 3 hours',
    health: 'HEALTHY',
    createdAt: '2026-10-01T09:00:00.000Z',
    networks: ['exyconn'],
    ipAddress: '172.18.0.4',
    ports: [
      { ip: '127.0.0.1', privatePort: 4004, publicPort: 4004, protocol: 'tcp' },
      { ip: '', privatePort: 9229, publicPort: 0, protocol: 'tcp' },
    ],
  },
  {
    id: 'c-2',
    name: 'mongo',
    image: 'mongo',
    imageTag: '7',
    state: 'EXITED',
    status: 'Exited (0) 2 days ago',
    health: 'NONE',
    createdAt: '2026-10-01T09:00:00.000Z',
    networks: [],
    ipAddress: '',
    ports: [],
  },
];

const answer = (overrides: object = {}) => ({
  data: { dockerContainers: CONTAINERS },
  loading: false,
  error: undefined,
  refetch: gql.refetch,
  networkStatus: NetworkStatus.ready,
  ...overrides,
});

const dialogProps = () => {
  if (!dialog.props) {
    throw new Error('ContainerDetailDialog was not rendered');
  }
  return dialog.props;
};

describe('ContainersPanel', () => {
  beforeEach(() => {
    opsTable.props = null;
    dialog.props = null;
    gql.refetch.mockReset();
    gql.containers.mockReset().mockReturnValue(answer());
  });

  it('polls the engine in the background every fifteen seconds', () => {
    renderWithProviders(<ContainersPanel />);

    expect(gql.containers).toHaveBeenCalledWith({
      fetchPolicy: 'cache-and-network',
      pollInterval: 15_000,
      context: { background: true },
    });
    expect(tableProps().onRefresh).toBe(gql.refetch);
  });

  it('shows the error the list failed with instead of the table', () => {
    gql.containers.mockReturnValue(answer({ data: undefined, error: new Error('engine down') }));
    renderWithProviders(<ContainersPanel />);

    expect(screen.getByRole('alert')).toHaveTextContent('engine down');
    expect(opsTable.props).toBeNull();
  });

  it('renders each container’s state, tag, ports and address', () => {
    renderWithProviders(<ContainersPanel />);

    expect(screen.getByTestId('c-1-name')).toHaveTextContent('portal-server');
    expect(screen.getByTestId('c-1-state')).toHaveTextContent('RUNNING');
    expect(screen.getByTestId('c-1-health')).toHaveTextContent('HEALTHY');
    expect(screen.getByTestId('c-1-status')).toHaveTextContent('Up 3 hours');
    expect(screen.getByTestId('c-1-imageTag')).toHaveTextContent('sha-4f2a9c1');
    expect(screen.getByTestId('c-1-ports')).toHaveTextContent(
      '127.0.0.1:4004 → 4004/tcp, 9229/tcp',
    );
    expect(screen.getByTestId('c-1-ipAddress')).toHaveTextContent('172.18.0.4');
    expect(screen.getByTestId('c-2-ports')).toHaveTextContent('—');
    expect(screen.getByTestId('c-2-ipAddress')).toHaveTextContent('—');
  });

  it('says the host has no containers when the list is empty or not yet read', () => {
    gql.containers.mockReturnValue(answer({ data: undefined, loading: true }));
    renderWithProviders(<ContainersPanel />);

    expect(screen.getByText('No containers on this host.')).toBeInTheDocument();
    expect(tableProps().loading).toBe(true);
  });

  it('does not flash the loading state on a background poll', () => {
    gql.containers.mockReturnValue(answer({ loading: true, networkStatus: NetworkStatus.poll }));
    renderWithProviders(<ContainersPanel />);

    expect(tableProps().loading).toBe(false);
  });

  it('opens the inspect from the row action or the row, and closes it again', async () => {
    renderWithProviders(<ContainersPanel />);
    expect(dialogProps()).toMatchObject({ containerId: null, name: '' });

    await userEvent.click(screen.getAllByRole('button', { name: 'inspect' })[0]);
    expect(dialogProps()).toMatchObject({ containerId: 'c-1', name: 'portal-server' });

    act(() => dialogProps().onClose());
    expect(dialogProps()).toMatchObject({ containerId: null, name: '' });

    await userEvent.click(screen.getByRole('button', { name: 'open c-2' }));
    expect(dialogProps()).toMatchObject({ containerId: 'c-2', name: 'mongo' });
  });
});
