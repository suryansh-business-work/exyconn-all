import { infraService } from '../../../../src/modules/infra/infra.service';
import {
  docker,
  type DockerContainerInspect,
  type DockerStats,
} from '../../../../src/modules/infra/docker.client';
import ips from '../../../fixtures/ips.json';

afterEach(() => {
  jest.restoreAllMocks();
});

const inspect: DockerContainerInspect = {
  Id: 'abc123',
  Name: '/exyconn-portal-server',
  Created: '2026-10-01T08:00:00.000Z',
  Path: 'node',
  Args: ['dist/index.js', '--port', '4004'],
  RestartCount: 2,
  Image: 'sha256:deadbeef',
  State: {
    Status: 'running',
    StartedAt: '2026-10-01T08:00:05.000Z',
    FinishedAt: '0001-01-01T00:00:00Z',
    ExitCode: 0,
    Health: { Status: 'healthy', FailingStreak: 0 },
  },
  Config: { Image: 'exyconn/exyconn-portal-server:9f2c1ab' },
  HostConfig: {
    RestartPolicy: { Name: 'unless-stopped', MaximumRetryCount: 0 },
    Memory: 1_073_741_824,
    NanoCpus: 1_500_000_000,
    LogConfig: { Type: 'json-file' },
  },
  NetworkSettings: { Networks: { exyconn_default: { IPAddress: ips.ip172_18_0_5 } } },
  Mounts: [
    { Type: 'bind', Source: '/opt/exyconn/uploads', Destination: '/app/uploads', RW: true },
    { Type: 'volume', Destination: '/data', RW: false },
  ],
};

const stats: DockerStats = {
  cpu_stats: { cpu_usage: { total_usage: 300 }, system_cpu_usage: 2_000, online_cpus: 2 },
  precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 1_000 },
  memory_stats: { usage: 900, stats: { cache: 100 } },
};

describe('container detail', () => {
  it('maps docker inspect and a live sample to the detail screen', async () => {
    jest.spyOn(docker, 'inspect').mockResolvedValue(inspect);
    jest.spyOn(docker, 'stats').mockResolvedValue(stats);

    const detail = await infraService.containerDetail('abc123');

    expect(docker.inspect).toHaveBeenCalledWith('abc123');
    expect(docker.stats).toHaveBeenCalledWith('abc123');
    expect(detail).toEqual({
      id: 'abc123',
      name: 'exyconn-portal-server',
      image: 'exyconn/exyconn-portal-server:9f2c1ab',
      imageTag: '9f2c1ab',
      imageId: 'sha256:deadbeef',
      state: 'RUNNING',
      health: 'HEALTHY',
      command: 'node dist/index.js --port 4004',
      createdAt: new Date('2026-10-01T08:00:00.000Z'),
      startedAt: new Date('2026-10-01T08:00:05.000Z'),
      exitCode: 0,
      restartCount: 2,
      restartPolicy: 'unless-stopped',
      logDriver: 'json-file',
      memoryLimitBytes: 1_073_741_824,
      cpuLimit: 1.5,
      networks: ['exyconn_default'],
      ipAddress: ips.ip172_18_0_5,
      mounts: [
        {
          type: 'bind',
          source: '/opt/exyconn/uploads',
          destination: '/app/uploads',
          readOnly: false,
        },
        { type: 'volume', source: '', destination: '/data', readOnly: true },
      ],
      cpuPercent: 40,
      memoryBytes: 800,
    });
  });

  it('fills defaults for a bare, never-started container', async () => {
    jest.spyOn(docker, 'inspect').mockResolvedValue({
      ...inspect,
      Args: [],
      State: { Status: 'created', StartedAt: '', FinishedAt: '', ExitCode: 0 },
      HostConfig: { Memory: 0, NanoCpus: 0 },
      NetworkSettings: undefined,
      Mounts: undefined,
    });
    jest.spyOn(docker, 'stats').mockResolvedValue({
      cpu_stats: { cpu_usage: { total_usage: 0 } },
      precpu_stats: { cpu_usage: { total_usage: 0 } },
      memory_stats: {},
    });

    const detail = await infraService.containerDetail('abc123');

    expect(detail).toMatchObject({
      state: 'CREATED',
      health: 'NONE',
      command: 'node',
      startedAt: null,
      restartPolicy: 'no',
      logDriver: '',
      cpuLimit: 0,
      networks: [],
      ipAddress: '',
      mounts: [],
      cpuPercent: 0,
      memoryBytes: 0,
    });
  });

  it('turns a multi-word health status into one token', async () => {
    jest.spyOn(docker, 'inspect').mockResolvedValue({
      ...inspect,
      State: { ...inspect.State, Health: { Status: 'health starting', FailingStreak: 0 } },
    });
    jest.spyOn(docker, 'stats').mockResolvedValue(stats);

    expect((await infraService.containerDetail('abc123')).health).toBe('HEALTH_STARTING');
  });
});
