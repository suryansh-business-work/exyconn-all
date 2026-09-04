import { env } from '../../config/env';

/**
 * Raised when the Docker engine cannot be read at all — not configured, unreachable,
 * or refusing. The Infrastructure screen reports the reason verbatim rather than
 * showing an empty stack, because "no containers" and "cannot see containers" are
 * completely different situations for whoever is on call.
 */
export class DockerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DockerUnavailableError';
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** A read of the engine API. GET only — this server never mutates the host stack. */
async function dockerGet<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  if (!env.dockerApiUrl) {
    throw new DockerUnavailableError(
      'DOCKER_API_URL is not set, so this server cannot read the Docker engine. Point it at the read-only socket proxy.',
    );
  }
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${env.dockerApiUrl}${path}`, { signal: controller.signal });
    if (!response.ok) {
      throw new DockerUnavailableError(
        `Docker engine answered HTTP ${response.status} for ${path}`,
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DockerUnavailableError) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : 'the request failed';
    throw new DockerUnavailableError(`Could not reach the Docker engine: ${reason}`);
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/** Subset of `GET /version` this server reads. */
export interface DockerVersion {
  Version: string;
  ApiVersion: string;
  GoVersion: string;
  Os: string;
  Arch: string;
  KernelVersion: string;
  GitCommit: string;
}

/** Subset of `GET /info` this server reads. */
export interface DockerInfo {
  Name: string;
  ServerVersion: string;
  OperatingSystem: string;
  OSType: string;
  Architecture: string;
  KernelVersion: string;
  NCPU: number;
  MemTotal: number;
  DockerRootDir: string;
  Driver: string;
  LoggingDriver: string;
  Containers: number;
  ContainersRunning: number;
  ContainersPaused: number;
  ContainersStopped: number;
  Images: number;
  SystemTime: string;
}

export interface DockerPort {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

/** Subset of one entry of `GET /containers/json`. */
export interface DockerContainerSummary {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Created: number;
  State: string;
  Status: string;
  Ports: DockerPort[];
  NetworkSettings?: { Networks?: Record<string, { IPAddress?: string }> };
}

/** Subset of `GET /containers/{id}/json`. Deliberately no `Config.Env` — it holds secrets. */
export interface DockerContainerInspect {
  Id: string;
  Name: string;
  Created: string;
  Path: string;
  Args: string[];
  RestartCount: number;
  Image: string;
  State: {
    Status: string;
    StartedAt: string;
    FinishedAt: string;
    ExitCode: number;
    Health?: { Status: string; FailingStreak: number };
  };
  Config: { Image: string; Labels?: Record<string, string> };
  HostConfig: {
    RestartPolicy?: { Name: string; MaximumRetryCount: number };
    Memory: number;
    NanoCpus: number;
    LogConfig?: { Type: string };
  };
  NetworkSettings?: { Networks?: Record<string, { IPAddress?: string }> };
  Mounts?: { Type: string; Source?: string; Destination: string; RW: boolean }[];
}

/** Subset of one entry of `GET /images/json`. */
export interface DockerImageSummary {
  Id: string;
  RepoTags: string[] | null;
  Created: number;
  Size: number;
  Containers: number;
}

/** Subset of `GET /system/df`. */
export interface DockerDf {
  LayersSize: number;
  Containers?: { SizeRw?: number }[];
  Volumes?: { UsageData?: { Size?: number } }[];
  BuildCache?: { Size?: number }[];
}

/** One-shot resource sample for a container. */
export interface DockerStats {
  cpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage?: number;
    online_cpus?: number;
  };
  precpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage?: number;
  };
  memory_stats: { usage?: number; limit?: number; stats?: { cache?: number } };
  networks?: Record<string, { rx_bytes: number; tx_bytes: number }>;
}

/** The engine reads this server is allowed to make, in one place. */
export const docker = {
  version: () => dockerGet<DockerVersion>('/version'),
  info: () => dockerGet<DockerInfo>('/info'),
  containers: () => dockerGet<DockerContainerSummary[]>('/containers/json?all=1'),
  inspect: (id: string) => dockerGet<DockerContainerInspect>(`/containers/${id}/json`),
  images: () => dockerGet<DockerImageSummary[]>('/images/json'),
  diskUsage: () => dockerGet<DockerDf>('/system/df', 20_000),
  // The engine samples twice a second apart to compute a CPU delta, so this one is slow
  // by nature — it is only ever asked for a single container the operator opened.
  stats: (id: string) => dockerGet<DockerStats>(`/containers/${id}/stats?stream=false`, 20_000),
};
