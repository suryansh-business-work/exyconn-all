import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { ContainerDetailDialog } from '../../../../src/pages/infrastructure/ContainerDetailDialog';
import { renderWithProviders } from '../../test-utils';
import { containerDetail } from './infra.fixtures';

const gql = vi.hoisted(() => ({ detail: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDockerContainerDetailQuery: gql.detail,
}));

const onClose = vi.fn();

function rowFor(label: string): HTMLElement {
  const row = screen.getByText(label).parentElement;
  if (!row) {
    throw new Error(`No row for ${label}`);
  }
  return row;
}

const open = (id: string | null = 'c-1') =>
  renderWithProviders(
    <ContainerDetailDialog containerId={id} name="portal-server" onClose={onClose} />,
  );

describe('ContainerDetailDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T10:00:00.000Z'));
    onClose.mockReset();
    gql.detail.mockReset().mockReturnValue({
      data: { dockerContainerDetail: containerDetail() },
      loading: false,
      error: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays closed, and asks for nothing, until a container is picked', () => {
    gql.detail.mockReturnValue({ data: undefined, loading: false, error: undefined });
    open(null);

    expect(gql.detail).toHaveBeenCalledWith({
      variables: { id: '' },
      skip: true,
      fetchPolicy: 'network-only',
    });
    expect(screen.queryByRole('heading', { name: 'portal-server' })).not.toBeInTheDocument();
  });

  it('reads a picked container fresh from the engine', () => {
    open('c-1');

    expect(gql.detail).toHaveBeenCalledWith({
      variables: { id: 'c-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByRole('heading', { name: 'portal-server' })).toBeInTheDocument();
  });

  it('shows a spinner while the inspect is on its way', () => {
    gql.detail.mockReturnValue({ data: undefined, loading: true, error: undefined });
    open();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the error the inspect failed with', () => {
    gql.detail.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('No such container'),
    });
    open();

    expect(screen.getByRole('alert')).toHaveTextContent('No such container');
    expect(screen.queryByText('State')).not.toBeInTheDocument();
  });

  it('lays out the inspect with its live sample against the limits', () => {
    open();

    expect(rowFor('State')).toHaveTextContent('RUNNING');
    expect(rowFor('Health')).toHaveTextContent('HEALTHY');
    expect(rowFor('Deployed tag')).toHaveTextContent('sha-4f2a9c1');
    expect(rowFor('Container ID')).toHaveTextContent('0123456789ab');
    expect(rowFor('Container ID')).not.toHaveTextContent('0123456789abc');
    expect(rowFor('Created')).toHaveTextContent(
      format(new Date('2026-10-01T09:00:00.000Z'), 'PPpp'),
    );
    expect(rowFor('Uptime')).toHaveTextContent('1d 2h 3m');
    expect(rowFor('Restarts')).toHaveTextContent('2 (policy: unless-stopped)');
    expect(rowFor('CPU now')).toHaveTextContent('3.2% of 1.5 cores');
    expect(rowFor('Memory now')).toHaveTextContent('128.0 MB of 512.0 MB');
    expect(rowFor('Networks')).toHaveTextContent('exyconn, proxy');
    expect(rowFor('Internal IP')).toHaveTextContent('203.0.113.4');
    expect(rowFor('Log driver')).toHaveTextContent('json-file');
  });

  it('lists each mount, naming an anonymous volume and whether it can be written', () => {
    open();

    expect(rowFor('Mount bind')).toHaveTextContent('/opt/exyconn/uploads → /app/uploads');
    expect(rowFor('Mount bind')).toHaveTextContent('read-write');
    expect(rowFor('Mount volume')).toHaveTextContent('(anonymous) → /data/cache');
    expect(rowFor('Mount volume')).toHaveTextContent('read-only');
  });

  it('says unlimited for missing limits and dashes what the engine left empty', () => {
    gql.detail.mockReturnValue({
      data: {
        dockerContainerDetail: containerDetail({
          cpuLimit: 0,
          memoryLimitBytes: 0,
          networks: [],
          ipAddress: '',
          logDriver: '',
          startedAt: null,
          mounts: [],
        }),
      },
      loading: true,
      error: undefined,
    });
    open();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(rowFor('CPU now')).toHaveTextContent('3.2% of unlimited');
    expect(rowFor('Memory now')).toHaveTextContent('128.0 MB of unlimited');
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.queryByText(/^Mount/)).not.toBeInTheDocument();
  });

  it('closes from its close button', async () => {
    open();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
