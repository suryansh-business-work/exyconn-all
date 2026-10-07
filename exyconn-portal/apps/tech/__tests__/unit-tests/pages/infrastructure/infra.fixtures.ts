import type {
  DockerContainerDetailQuery,
  InfrastructureOverviewQuery,
} from '@exyconn/shell/graphql/generated';

type Overview = InfrastructureOverviewQuery['infrastructureOverview'];
type Detail = DockerContainerDetailQuery['dockerContainerDetail'];

const MB = 1024 * 1024;

/** A healthy host as the overview query reports it. */
export function overview(overrides: Partial<Overview> = {}): Overview {
  return {
    docker: {
      reachable: true,
      error: '',
      name: 'vps-1',
      serverVersion: '27.1.0',
      apiVersion: '1.46',
      operatingSystem: 'Ubuntu 24.04',
      osType: 'linux',
      kernelVersion: '6.8.0',
      architecture: 'x86_64',
      cpus: 6,
      memoryBytes: 8 * 1024 * MB,
      dockerRootDir: '/var/lib/docker',
      storageDriver: 'overlay2',
      loggingDriver: 'json-file',
      containersRunning: 12,
      containersPaused: 0,
      containersStopped: 3,
      imagesCount: 21,
      serverTime: '2026-10-07T10:00:00.000Z',
    },
    runtime: {
      nodeVersion: 'v22.11.0',
      platform: 'linux',
      arch: 'x64',
      hostname: 'api-7f9',
      environment: 'production',
      processUptimeSeconds: 3720,
      startedAt: '2026-10-07T08:58:00.000Z',
      rssBytes: 200 * MB,
      heapUsedBytes: 100 * MB,
      heapTotalBytes: 150 * MB,
      load1: 0.5,
      load5: 1.25,
      load15: 2,
    },
    database: {
      name: 'exyconn',
      version: '7.0.14',
      host: 'mongo:27017',
      uptimeSeconds: 90_000,
      connectionsCurrent: 9,
      connectionsAvailable: 811,
      collections: 37,
      objects: 12_345,
      dataSizeBytes: 1024,
      storageSizeBytes: 2048,
      indexSizeBytes: 512,
    },
    ...overrides,
  };
}

/** One container's inspect, with a live sample and limits set. */
export function containerDetail(overrides: Partial<Detail> = {}): Detail {
  return {
    id: '0123456789abcdef0123',
    name: 'portal-server',
    image: 'ghcr.io/exyconn/portal-server',
    imageTag: 'sha-4f2a9c1',
    imageId: 'sha256:feedface',
    state: 'RUNNING',
    health: 'HEALTHY',
    command: 'node dist/index.js',
    createdAt: '2026-10-01T09:00:00.000Z',
    startedAt: '2026-10-06T07:57:00.000Z',
    exitCode: 0,
    restartCount: 2,
    restartPolicy: 'unless-stopped',
    logDriver: 'json-file',
    memoryLimitBytes: 512 * MB,
    cpuLimit: 1.5,
    networks: ['exyconn', 'proxy'],
    ipAddress: '172.18.0.4',
    cpuPercent: 3.2,
    memoryBytes: 128 * MB,
    mounts: [
      {
        type: 'bind',
        source: '/opt/exyconn/uploads',
        destination: '/app/uploads',
        readOnly: false,
      },
      { type: 'volume', source: '', destination: '/data/cache', readOnly: true },
    ],
    ...overrides,
  };
}
