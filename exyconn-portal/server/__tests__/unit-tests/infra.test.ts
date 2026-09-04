import { infraService } from '../../src/modules/infra/infra.service';
import { docker, DockerUnavailableError } from '../../src/modules/infra/docker.client';

const { containerName, healthOf, tagOf, cpuPercent, memoryUsed, mapContainer } =
  infraService.internals;

describe('infra service mapping', () => {
  it('strips the leading slash Docker puts on container names', () => {
    expect(containerName(['/exyconn-portal-server'])).toBe('exyconn-portal-server');
    expect(containerName([])).toBe('');
  });

  it('reads health out of the status text the list API returns', () => {
    expect(healthOf('Up 4 hours (healthy)')).toBe('HEALTHY');
    expect(healthOf('Up 2 minutes (health: starting)')).toBe('STARTING');
    expect(healthOf('Up 9 days (unhealthy)')).toBe('UNHEALTHY');
    expect(healthOf('Exited (0) 3 days ago')).toBe('NONE');
  });

  it('takes the deployed tag from the image reference', () => {
    expect(tagOf('exyconn/exyconn-portal-server:9f2c1ab')).toBe('9f2c1ab');
    expect(tagOf('tecnativa/docker-socket-proxy')).toBe('latest');
    // A registry port must not be mistaken for a tag.
    expect(tagOf('registry.example.com:5000/exyconn/api')).toBe('latest');
  });

  it('computes CPU percent from the delta over the host, as docker stats does', () => {
    const stats = {
      cpu_stats: {
        cpu_usage: { total_usage: 2_000_000 },
        system_cpu_usage: 20_000_000,
        online_cpus: 4,
      },
      precpu_stats: { cpu_usage: { total_usage: 1_000_000 }, system_cpu_usage: 10_000_000 },
      memory_stats: { usage: 500, limit: 1000, stats: { cache: 100 } },
    };
    expect(cpuPercent(stats)).toBe(40);
    expect(memoryUsed(stats)).toBe(400);
  });

  it('reports no CPU use when the engine has only one sample', () => {
    const stats = {
      cpu_stats: { cpu_usage: { total_usage: 1_000 }, system_cpu_usage: 0 },
      precpu_stats: { cpu_usage: { total_usage: 0 }, system_cpu_usage: 0 },
      memory_stats: {},
    };
    expect(cpuPercent(stats)).toBe(0);
    expect(memoryUsed(stats)).toBe(0);
  });

  it('maps a container summary to what the Infrastructure screen renders', () => {
    const row = mapContainer({
      Id: 'abc123',
      Names: ['/exyconn-portal-server'],
      Image: 'exyconn/exyconn-portal-server:9f2c1ab',
      ImageID: 'sha256:deadbeef',
      Created: 1_756_000_000,
      State: 'running',
      Status: 'Up 4 hours (healthy)',
      Ports: [{ IP: '127.0.0.1', PrivatePort: 4004, PublicPort: 4004, Type: 'tcp' }],
      NetworkSettings: { Networks: { exyconn_default: { IPAddress: '172.18.0.5' } } },
    });
    expect(row).toMatchObject({
      name: 'exyconn-portal-server',
      imageTag: '9f2c1ab',
      state: 'RUNNING',
      health: 'HEALTHY',
      networks: ['exyconn_default'],
      ipAddress: '172.18.0.5',
    });
    expect(row.createdAt).toEqual(new Date(1_756_000_000 * 1000));
  });
});

describe('docker client', () => {
  it('refuses to guess when no engine is configured', async () => {
    // DOCKER_API_URL is unset in tests, which is exactly the misconfigured deployment.
    await expect(docker.info()).rejects.toBeInstanceOf(DockerUnavailableError);
  });

  it('reports an unreadable engine as a state rather than failing the overview', async () => {
    const overview = await infraService.overview();
    expect(overview.docker.reachable).toBe(false);
    expect(overview.docker.error).toContain('DOCKER_API_URL');
    expect(overview.runtime.nodeVersion).toBe(process.version);
    expect(overview.database.collections).toBeGreaterThanOrEqual(0);
  });
});
