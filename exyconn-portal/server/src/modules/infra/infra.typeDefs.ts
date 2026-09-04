import gql from 'graphql-tag';

/**
 * Infrastructure: what this platform is actually running on, read live from the Docker
 * engine, this process and MongoDB. Nothing here is stored or seeded — every field is a
 * measurement taken when the query runs, so a stale answer is impossible.
 */
export const infraTypeDefs = gql`
  "The Docker engine and the machine hosting it. Unreadable is a state, not an error."
  type DockerHost {
    reachable: Boolean!
    "Why the engine could not be read. Empty when reachable."
    error: String!
    name: String!
    serverVersion: String!
    apiVersion: String!
    operatingSystem: String!
    osType: String!
    kernelVersion: String!
    architecture: String!
    cpus: Int!
    memoryBytes: Float!
    dockerRootDir: String!
    storageDriver: String!
    loggingDriver: String!
    containersRunning: Int!
    containersPaused: Int!
    containersStopped: Int!
    imagesCount: Int!
    serverTime: DateTime
  }

  "The API process itself, as it sees the world from inside its own container."
  type ServerRuntime {
    nodeVersion: String!
    platform: String!
    arch: String!
    hostname: String!
    environment: String!
    processUptimeSeconds: Int!
    startedAt: DateTime!
    rssBytes: Float!
    heapUsedBytes: Float!
    heapTotalBytes: Float!
    load1: Float!
    load5: Float!
    load15: Float!
  }

  "The MongoDB this server is connected to, reported by the database server."
  type DatabaseInfo {
    name: String!
    version: String!
    host: String!
    uptimeSeconds: Int!
    connectionsCurrent: Int!
    connectionsAvailable: Int!
    collections: Int!
    objects: Float!
    dataSizeBytes: Float!
    storageSizeBytes: Float!
    indexSizeBytes: Float!
  }

  type InfrastructureOverview {
    docker: DockerHost!
    runtime: ServerRuntime!
    database: DatabaseInfo!
  }

  "A published port: the host side is what nginx proxies a public domain to."
  type ContainerPort {
    ip: String!
    privatePort: Int!
    publicPort: Int!
    protocol: String!
  }

  type DockerContainer {
    id: ID!
    name: String!
    image: String!
    "The image's :tag — for this stack, the commit SHA that was deployed."
    imageTag: String!
    state: String!
    status: String!
    health: String!
    createdAt: DateTime!
    ports: [ContainerPort!]!
    networks: [String!]!
    ipAddress: String!
  }

  type ContainerMount {
    type: String!
    source: String!
    destination: String!
    readOnly: Boolean!
  }

  "Everything docker inspect says about one container, plus a live resource sample."
  type DockerContainerDetail {
    id: ID!
    name: String!
    image: String!
    imageTag: String!
    imageId: String!
    state: String!
    health: String!
    command: String!
    createdAt: DateTime!
    startedAt: DateTime
    exitCode: Int!
    restartCount: Int!
    restartPolicy: String!
    logDriver: String!
    memoryLimitBytes: Float!
    "CPU limit in cores. 0 means unlimited."
    cpuLimit: Float!
    networks: [String!]!
    ipAddress: String!
    mounts: [ContainerMount!]!
    cpuPercent: Float!
    memoryBytes: Float!
  }

  type DockerImage {
    id: ID!
    repoTags: [String!]!
    sizeBytes: Float!
    createdAt: DateTime!
    containers: Int!
  }

  type DockerDiskUsage {
    layersBytes: Float!
    containersBytes: Float!
    volumesBytes: Float!
    buildCacheBytes: Float!
  }

  type DockerStorage {
    images: [DockerImage!]!
    usage: DockerDiskUsage!
  }

  extend type Query {
    "Host, this process and the database in one read — the Infrastructure overview."
    infrastructureOverview: InfrastructureOverview!
    "Every container on the host, running or not."
    dockerContainers: [DockerContainer!]!
    "One container in full, including a live CPU/memory sample (takes ~2s to measure)."
    dockerContainerDetail(id: ID!): DockerContainerDetail!
    "Images on the host and what the engine's disk is spent on."
    dockerStorage: DockerStorage!
  }
`;
