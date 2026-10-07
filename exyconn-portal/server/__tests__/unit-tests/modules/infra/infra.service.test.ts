import mongoose from 'mongoose';
import { infraService } from '../../../../src/modules/infra/infra.service';
import {
  docker,
  type DockerInfo,
  type DockerVersion,
} from '../../../../src/modules/infra/docker.client';

const info: DockerInfo = {
  Name: 'vps-1',
  ServerVersion: '27.1.1',
  OperatingSystem: 'Ubuntu 24.04 LTS',
  OSType: 'linux',
  Architecture: 'x86_64',
  KernelVersion: '6.8.0',
  NCPU: 4,
  MemTotal: 8_000_000_000,
  DockerRootDir: '/var/lib/docker',
  Driver: 'overlay2',
  LoggingDriver: 'json-file',
  Containers: 9,
  ContainersRunning: 7,
  ContainersPaused: 0,
  ContainersStopped: 2,
  Images: 14,
  SystemTime: '2026-10-07T09:00:00.000Z',
};

const version: DockerVersion = {
  Version: '27.1.1',
  ApiVersion: '1.46',
  GoVersion: 'go1.22',
  Os: 'linux',
  Arch: 'amd64',
  KernelVersion: '6.8.0',
  GitCommit: 'abc',
};

afterEach(() => {
  jest.restoreAllMocks();
});

/** Swaps the live connection's database handle for one test, restoring it afterwards. */
async function withDatabase<T>(db: unknown, run: () => Promise<T>): Promise<T> {
  const connection = mongoose.connection as unknown as { db: unknown };
  const original = connection.db;
  connection.db = db;
  try {
    return await run();
  } finally {
    connection.db = original;
  }
}

describe('infrastructure overview', () => {
  it('describes a reachable engine field by field', async () => {
    jest.spyOn(docker, 'info').mockResolvedValue(info);
    jest.spyOn(docker, 'version').mockResolvedValue(version);

    const overview = await infraService.overview();

    expect(overview.docker).toEqual({
      reachable: true,
      error: '',
      name: 'vps-1',
      serverVersion: '27.1.1',
      apiVersion: '1.46',
      operatingSystem: 'Ubuntu 24.04 LTS',
      osType: 'linux',
      kernelVersion: '6.8.0',
      architecture: 'x86_64',
      cpus: 4,
      memoryBytes: 8_000_000_000,
      dockerRootDir: '/var/lib/docker',
      storageDriver: 'overlay2',
      loggingDriver: 'json-file',
      containersRunning: 7,
      containersPaused: 0,
      containersStopped: 2,
      imagesCount: 14,
      serverTime: new Date('2026-10-07T09:00:00.000Z'),
    });
  });

  it('hides an unexpected engine failure behind a generic reason', async () => {
    jest.spyOn(docker, 'info').mockRejectedValue(new Error('socket path leaked here'));
    jest.spyOn(docker, 'version').mockResolvedValue(version);

    const { docker: host } = await infraService.overview();

    expect(host.reachable).toBe(false);
    expect(host.error).toBe('The Docker engine could not be read.');
    expect(host.serverTime).toBeNull();
    expect(host.cpus).toBe(0);
  });

  it('reports this process, falling back to development when NODE_ENV is unset', async () => {
    jest.spyOn(docker, 'info').mockResolvedValue(info);
    jest.spyOn(docker, 'version').mockResolvedValue(version);
    const saved = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    try {
      const { runtime } = await infraService.overview();

      expect(runtime.environment).toBe('development');
      expect(runtime.nodeVersion).toBe(process.version);
      expect(runtime.processUptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(runtime.startedAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(runtime.heapUsedBytes).toBeGreaterThan(0);
    } finally {
      process.env.NODE_ENV = saved;
    }
  });

  it('reads the connected MongoDB server', async () => {
    jest.spyOn(docker, 'info').mockResolvedValue(info);
    jest.spyOn(docker, 'version').mockResolvedValue(version);

    const { database } = await infraService.overview();

    expect(database.name).toBe(mongoose.connection.db?.databaseName);
    expect(database.version).toMatch(/^\d+\.\d+/);
    expect(database.connectionsCurrent).toBeGreaterThan(0);
  });

  it('reads zero rather than NaN when the database omits a statistic', async () => {
    jest.spyOn(docker, 'info').mockResolvedValue(info);
    jest.spyOn(docker, 'version').mockResolvedValue(version);
    const bare = {
      databaseName: 'portal',
      admin: () => ({ serverStatus: () => Promise.resolve({}) }),
      stats: () => Promise.resolve({}),
    };

    const { database } = await withDatabase(bare, () => infraService.overview());

    expect(database).toEqual({
      name: 'portal',
      version: '',
      host: '',
      uptimeSeconds: 0,
      connectionsCurrent: 0,
      connectionsAvailable: 0,
      collections: 0,
      objects: 0,
      dataSizeBytes: 0,
      storageSizeBytes: 0,
      indexSizeBytes: 0,
    });
  });

  it('fails the overview when the server holds no database handle', async () => {
    jest.spyOn(docker, 'info').mockResolvedValue(info);
    jest.spyOn(docker, 'version').mockResolvedValue(version);

    await expect(withDatabase(undefined, () => infraService.overview())).rejects.toThrow(
      'The server is not connected to MongoDB.',
    );
  });
});
