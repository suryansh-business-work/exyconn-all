import os from 'node:os';
import mongoose from 'mongoose';
import {
  docker,
  DockerUnavailableError,
  type DockerContainerInspect,
  type DockerContainerSummary,
  type DockerStats,
} from './docker.client';

/** `/exyconn-portal-server` -> `exyconn-portal-server`. */
function containerName(names: string[]): string {
  const first = names[0] ?? '';
  return first.startsWith('/') ? first.slice(1) : first;
}

/** `docker ps` puts health in the status text; that is the only place the list API has it. */
function healthOf(status: string): string {
  const match = /\((healthy|unhealthy|health: starting)\)/.exec(status);
  if (!match) {
    return 'NONE';
  }
  return match[1] === 'health: starting' ? 'STARTING' : match[1].toUpperCase();
}

/** The `:tag` half of `owner/image:tag`, which for this stack is the deployed commit SHA. */
function tagOf(image: string): string {
  const lastColon = image.lastIndexOf(':');
  if (lastColon === -1 || image.includes('/', lastColon)) {
    return 'latest';
  }
  return image.slice(lastColon + 1);
}

function networksOf(container: {
  NetworkSettings?: { Networks?: Record<string, { IPAddress?: string }> };
}): { names: string[]; ip: string } {
  const networks = container.NetworkSettings?.Networks ?? {};
  const names = Object.keys(networks);
  const ip = names.map((name) => networks[name].IPAddress ?? '').find(Boolean) ?? '';
  return { names, ip };
}

function mapContainer(row: DockerContainerSummary) {
  const { names, ip } = networksOf(row);
  return {
    id: row.Id,
    name: containerName(row.Names),
    image: row.Image,
    imageTag: tagOf(row.Image),
    state: row.State.toUpperCase(),
    status: row.Status,
    health: healthOf(row.Status),
    createdAt: new Date(row.Created * 1000),
    ports: row.Ports.map((port) => ({
      ip: port.IP ?? '',
      privatePort: port.PrivatePort,
      publicPort: port.PublicPort ?? 0,
      protocol: port.Type,
    })),
    networks: names,
    ipAddress: ip,
  };
}

/** CPU percent the way `docker stats` computes it: this container's delta over the host's. */
function cpuPercent(stats: DockerStats): number {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    (stats.cpu_stats.system_cpu_usage ?? 0) - (stats.precpu_stats.system_cpu_usage ?? 0);
  if (cpuDelta <= 0 || systemDelta <= 0) {
    return 0;
  }
  const cpus = stats.cpu_stats.online_cpus ?? 1;
  return Number(((cpuDelta / systemDelta) * cpus * 100).toFixed(2));
}

/** Docker reports page cache inside usage; `docker stats` subtracts it, so this does too. */
function memoryUsed(stats: DockerStats): number {
  const usage = stats.memory_stats.usage ?? 0;
  return Math.max(0, usage - (stats.memory_stats.stats?.cache ?? 0));
}

function mapInspect(detail: DockerContainerInspect, stats: DockerStats) {
  const { names, ip } = networksOf(detail);
  const policy = detail.HostConfig.RestartPolicy;
  return {
    id: detail.Id,
    name: containerName([detail.Name]),
    image: detail.Config.Image,
    imageTag: tagOf(detail.Config.Image),
    imageId: detail.Image,
    state: detail.State.Status.toUpperCase(),
    health: (detail.State.Health?.Status ?? 'none').toUpperCase().replace(' ', '_'),
    command: [detail.Path, ...detail.Args].join(' '),
    createdAt: new Date(detail.Created),
    startedAt: detail.State.StartedAt ? new Date(detail.State.StartedAt) : null,
    exitCode: detail.State.ExitCode,
    restartCount: detail.RestartCount,
    restartPolicy: policy?.Name ?? 'no',
    logDriver: detail.HostConfig.LogConfig?.Type ?? '',
    memoryLimitBytes: detail.HostConfig.Memory,
    cpuLimit: detail.HostConfig.NanoCpus / 1e9,
    networks: names,
    ipAddress: ip,
    mounts: (detail.Mounts ?? []).map((mount) => ({
      type: mount.Type,
      source: mount.Source ?? '',
      destination: mount.Destination,
      readOnly: !mount.RW,
    })),
    cpuPercent: cpuPercent(stats),
    memoryBytes: memoryUsed(stats),
  };
}

/** The engine and the machine it runs on. Never throws: an unreadable engine is a state. */
async function dockerHost() {
  try {
    const [info, version] = await Promise.all([docker.info(), docker.version()]);
    return {
      reachable: true,
      error: '',
      name: info.Name,
      serverVersion: info.ServerVersion,
      apiVersion: version.ApiVersion,
      operatingSystem: info.OperatingSystem,
      osType: info.OSType,
      kernelVersion: info.KernelVersion,
      architecture: info.Architecture,
      cpus: info.NCPU,
      memoryBytes: info.MemTotal,
      dockerRootDir: info.DockerRootDir,
      storageDriver: info.Driver,
      loggingDriver: info.LoggingDriver,
      containersRunning: info.ContainersRunning,
      containersPaused: info.ContainersPaused,
      containersStopped: info.ContainersStopped,
      imagesCount: info.Images,
      serverTime: new Date(info.SystemTime),
    };
  } catch (error) {
    const reason =
      error instanceof DockerUnavailableError
        ? error.message
        : 'The Docker engine could not be read.';
    return {
      reachable: false,
      error: reason,
      name: '',
      serverVersion: '',
      apiVersion: '',
      operatingSystem: '',
      osType: '',
      kernelVersion: '',
      architecture: '',
      cpus: 0,
      memoryBytes: 0,
      dockerRootDir: '',
      storageDriver: '',
      loggingDriver: '',
      containersRunning: 0,
      containersPaused: 0,
      containersStopped: 0,
      imagesCount: 0,
      serverTime: null,
    };
  }
}

/** This API process itself, as it sees the world from inside its own container. */
function serverRuntime() {
  const memory = process.memoryUsage();
  const [load1, load5, load15] = os.loadavg();
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    environment: process.env.NODE_ENV ?? 'development',
    processUptimeSeconds: Math.round(process.uptime()),
    startedAt: new Date(Date.now() - process.uptime() * 1000),
    rssBytes: memory.rss,
    heapUsedBytes: memory.heapUsed,
    heapTotalBytes: memory.heapTotal,
    load1,
    load5,
    load15,
  };
}

/** The MongoDB this server is actually connected to, straight from the server itself. */
async function databaseInfo() {
  const connection = mongoose.connection;
  const db = connection.db;
  if (connection.readyState !== 1 || !db) {
    throw new Error('The server is not connected to MongoDB.');
  }
  const [status, stats] = await Promise.all([db.admin().serverStatus(), db.stats()]);
  return {
    name: db.databaseName,
    version: String(status.version ?? ''),
    host: String(status.host ?? ''),
    uptimeSeconds: Math.round(Number(status.uptime ?? 0)),
    connectionsCurrent: Number(status.connections?.current ?? 0),
    connectionsAvailable: Number(status.connections?.available ?? 0),
    collections: Number(stats.collections ?? 0),
    objects: Number(stats.objects ?? 0),
    dataSizeBytes: Number(stats.dataSize ?? 0),
    storageSizeBytes: Number(stats.storageSize ?? 0),
    indexSizeBytes: Number(stats.indexSize ?? 0),
  };
}

/** Images on the host plus what the engine says its own disk is spent on. */
async function dockerStorage() {
  const [images, df] = await Promise.all([docker.images(), docker.diskUsage()]);
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  return {
    images: images.map((image) => ({
      id: image.Id,
      repoTags: image.RepoTags ?? [],
      sizeBytes: image.Size,
      createdAt: new Date(image.Created * 1000),
      containers: image.Containers,
    })),
    usage: {
      layersBytes: df.LayersSize,
      containersBytes: sum((df.Containers ?? []).map((row) => row.SizeRw ?? 0)),
      volumesBytes: sum((df.Volumes ?? []).map((row) => row.UsageData?.Size ?? 0)),
      buildCacheBytes: sum((df.BuildCache ?? []).map((row) => row.Size ?? 0)),
    },
  };
}

export const infraService = {
  overview: async () => ({
    docker: await dockerHost(),
    runtime: serverRuntime(),
    database: await databaseInfo(),
  }),
  containers: async () => (await docker.containers()).map(mapContainer),
  containerDetail: async (id: string) => {
    const [detail, stats] = await Promise.all([docker.inspect(id), docker.stats(id)]);
    return mapInspect(detail, stats);
  },
  storage: dockerStorage,
  // Exported for the unit tests, which drive the pure mapping without an engine.
  internals: { containerName, healthOf, tagOf, cpuPercent, memoryUsed, mapContainer },
};
