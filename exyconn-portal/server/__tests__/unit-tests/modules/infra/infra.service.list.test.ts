import { infraService } from '../../../../src/modules/infra/infra.service';
import { docker } from '../../../../src/modules/infra/docker.client';

const { containerName, cpuPercent, mapContainer } = infraService.internals;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('container list', () => {
  it('maps every container the engine lists', async () => {
    jest.spyOn(docker, 'containers').mockResolvedValue([
      {
        Id: 'def456',
        Names: ['/exyconn-mongo'],
        Image: 'mongo:7',
        ImageID: 'sha256:cafe',
        Created: 1_756_000_000,
        State: 'exited',
        Status: 'Exited (0) 3 days ago',
        // An unpublished port has neither a host address nor a public side.
        Ports: [{ PrivatePort: 27017, Type: 'tcp' }],
        // A network without an address gives no IP rather than an empty-string match.
        NetworkSettings: { Networks: { none: {} } },
      },
    ]);

    const [row] = await infraService.containers();

    expect(row).toEqual({
      id: 'def456',
      name: 'exyconn-mongo',
      image: 'mongo:7',
      imageTag: '7',
      state: 'EXITED',
      status: 'Exited (0) 3 days ago',
      health: 'NONE',
      createdAt: new Date(1_756_000_000_000),
      ports: [{ ip: '', privatePort: 27017, publicPort: 0, protocol: 'tcp' }],
      networks: ['none'],
      ipAddress: '',
    });
  });

  it('keeps a name that has no leading slash as it is', () => {
    expect(containerName(['already-clean'])).toBe('already-clean');
  });

  it('maps a container the engine gives no network settings for', () => {
    const row = mapContainer({
      Id: 'x',
      Names: ['/x'],
      Image: 'x:1',
      ImageID: 'sha256:x',
      Created: 0,
      State: 'running',
      Status: 'Up 1 second',
      Ports: [],
    });

    expect(row.networks).toEqual([]);
    expect(row.ipAddress).toBe('');
  });
});

describe('cpu percent', () => {
  it('assumes one CPU when the engine does not say how many are online', () => {
    expect(
      cpuPercent({
        cpu_stats: { cpu_usage: { total_usage: 50 }, system_cpu_usage: 1_000 },
        precpu_stats: { cpu_usage: { total_usage: 0 } },
        memory_stats: {},
      }),
    ).toBe(5);
  });

  it('reports zero when the container used no CPU between samples', () => {
    expect(
      cpuPercent({
        cpu_stats: { cpu_usage: { total_usage: 10 }, system_cpu_usage: 2_000, online_cpus: 2 },
        precpu_stats: { cpu_usage: { total_usage: 10 }, system_cpu_usage: 1_000 },
        memory_stats: {},
      }),
    ).toBe(0);
  });
});
