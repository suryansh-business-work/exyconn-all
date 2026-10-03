import { ConfigurationError, notFound } from '../../utils/errors';
import { assertPublicHttpsUrl } from '../../utils/safeFetch';
import { logger } from '../../utils/logger';
import { requireSecret, withoutBlankSecret } from '../tech/tech.service';
import { SonarConfigModel } from './sonar-config.model';
import { SonarClient, SonarError, baseUrl, type SonarProblem } from './sonar.client';
import {
  METRIC_KEYS,
  facetCounts,
  mapAnalyses,
  mapIssues,
  mapMetrics,
  mapQualityGate,
  projectUrl,
  type AnalysesPayload,
  type IssuesPayload,
  type MeasuresPayload,
  type QualityGatePayload,
} from './sonar.mapping';

export interface SonarConfigInput {
  label: string;
  hostUrl: string;
  token: string;
  projectKey: string;
  organization?: string | null;
  isActive?: boolean;
}

/** How long an overview is reused before SonarQube is asked again. */
export const SONAR_CACHE_TTL_MS = 5 * 60_000;

/** Recent analyses and top open issues the dashboard lists. */
const ANALYSES_PAGE = 10;
const ISSUES_PAGE = 20;

export type SonarOverviewState = 'OK' | 'NOT_CONFIGURED' | SonarProblem;

type StoredConfig = NonNullable<Awaited<ReturnType<typeof activeConfig>>>;

type SonarOverview = Awaited<ReturnType<typeof readProject>>;

let cache: { key: string; at: number; overview: SonarOverview } | null = null;

/** Forgets the cached overview (tests, and after a config changes). */
export function clearSonarCache(): void {
  cache = null;
}

function activeConfig() {
  return SonarConfigModel.findOne({ isActive: true }).lean();
}

/** The fields every overview carries, whatever state it is in. */
function overviewBase(config: StoredConfig | null) {
  return {
    configLabel: config?.label ?? '',
    projectKey: config?.projectKey ?? '',
    projectUrl: config ? projectUrl(config.hostUrl, config.projectKey) : '',
    checkedAt: new Date(),
  };
}

/** An overview that has nothing to show but a reason. */
function problemOverview(config: StoredConfig | null, state: SonarOverviewState, message: string) {
  return {
    ...overviewBase(config),
    state,
    message,
    qualityGate: null,
    metrics: null,
    analyses: [],
    issues: [],
    issuesTotal: 0,
    severityCounts: [],
    typeCounts: [],
  };
}

/** The open-issue search: worst first, one page, optionally one severity only. */
function issueParams(config: StoredConfig, severity?: string) {
  const params: Record<string, string | number> = {
    componentKeys: config.projectKey,
    resolved: 'false',
    ps: ISSUES_PAGE,
    s: 'SEVERITY',
    asc: 'false',
    facets: 'severities,types',
  };
  if (config.organization) {
    params.organization = config.organization;
  }
  if (severity) {
    params.severities = severity;
  }
  return params;
}

/** Reads the four Web API resources the dashboard is built from, in parallel. */
async function readProject(config: StoredConfig) {
  const client = new SonarClient(config);
  const { projectKey } = config;
  // The first call settles the auth scheme, so the rest do not each retry on a 401.
  const gate = await client.get<QualityGatePayload>('/api/qualitygates/project_status', {
    projectKey,
  });
  const [measures, analyses, issues] = await Promise.all([
    client.get<MeasuresPayload>('/api/measures/component', {
      component: projectKey,
      metricKeys: METRIC_KEYS,
    }),
    client.get<AnalysesPayload>('/api/project_analyses/search', {
      project: projectKey,
      ps: ANALYSES_PAGE,
    }),
    client.get<IssuesPayload>('/api/issues/search', issueParams(config)),
  ]);
  return {
    ...overviewBase(config),
    state: 'OK' as const,
    message: '',
    qualityGate: mapQualityGate(gate),
    metrics: mapMetrics(measures),
    analyses: mapAnalyses(analyses),
    issues: mapIssues(issues, config.hostUrl, projectKey),
    issuesTotal: issues.total ?? 0,
    severityCounts: facetCounts(issues, 'severities'),
    typeCounts: facetCounts(issues, 'types'),
  };
}

/** The message for a failure that is not a SonarError — logged, never shown raw. */
function unexpected(error: unknown): string {
  logger.error(error, 'SonarQube request failed');
  return 'SonarQube could not be read.';
}

/** Validates what a person typed before it is stored. */
async function cleanInput(input: SonarConfigInput) {
  await assertPublicHttpsUrl(input.hostUrl);
  return { ...input, hostUrl: baseUrl(input.hostUrl), organization: input.organization ?? '' };
}

class SonarService {
  listConfigs() {
    return SonarConfigModel.find().sort({ createdAt: -1 }).lean();
  }

  async createConfig(input: SonarConfigInput) {
    requireSecret(input.token, 'A SonarQube token');
    const values = await cleanInput(input);
    if (input.isActive) await SonarConfigModel.updateMany({}, { isActive: false });
    clearSonarCache();
    return (await SonarConfigModel.create(values)).toObject();
  }

  async updateConfig(id: string, input: SonarConfigInput) {
    const values = await cleanInput(input);
    if (input.isActive) {
      await SonarConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const update = withoutBlankSecret(values, 'token');
    const doc = await SonarConfigModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) notFound('SonarQube config');
    clearSonarCache();
    return doc;
  }

  async deleteConfig(id: string) {
    const doc = await SonarConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('SonarQube config');
    clearSonarCache();
    return true;
  }

  /** Checks the token, then that it can see the project. Says what failed rather than throwing. */
  async testConnection(id: string) {
    const config = await SonarConfigModel.findById(id).lean();
    if (!config) notFound('SonarQube config');
    const client = new SonarClient(config);
    try {
      const auth = await client.get<{ valid?: boolean }>('/api/authentication/validate');
      if (!auth.valid) {
        return { ok: false, message: 'SonarQube did not accept the token.' };
      }
      const found = await client.get<{ component?: { name?: string } }>('/api/components/show', {
        component: config.projectKey,
      });
      const name = found.component?.name ?? config.projectKey;
      return { ok: true, message: `Connected to SonarQube and found the project ${name}.` };
    } catch (error) {
      const message = error instanceof SonarError ? error.message : unexpected(error);
      return { ok: false, message };
    }
  }

  /**
   * The worst open issues of one severity. The overview lists the worst of all severities, so
   * a filtered table asks for its own page rather than filtering that one down to nothing.
   */
  async issues(severity: string) {
    const config = await activeConfig();
    if (!config) {
      throw new ConfigurationError('No SonarQube project is set up yet.');
    }
    try {
      const page = await new SonarClient(config).get<IssuesPayload>(
        '/api/issues/search',
        issueParams(config, severity),
      );
      return mapIssues(page, config.hostUrl, config.projectKey);
    } catch (error) {
      if (error instanceof SonarError) {
        throw new ConfigurationError(error.message);
      }
      throw error;
    }
  }

  /** The active project's dashboard, from the cache unless it is stale or `refresh` is set. */
  async overview(refresh: boolean) {
    const config = await activeConfig();
    if (!config) {
      return problemOverview(null, 'NOT_CONFIGURED', 'No SonarQube project is set up yet.');
    }
    const key = `${String(config._id)}:${config.updatedAt.toISOString()}`;
    if (!refresh && cache?.key === key && Date.now() - cache.at < SONAR_CACHE_TTL_MS) {
      return cache.overview;
    }
    try {
      const overview = await readProject(config);
      cache = { key, at: Date.now(), overview };
      return overview;
    } catch (error) {
      if (error instanceof SonarError) {
        return problemOverview(config, error.problem, error.message);
      }
      return problemOverview(config, 'ERROR', unexpected(error));
    }
  }
}

export const sonarService = new SonarService();
