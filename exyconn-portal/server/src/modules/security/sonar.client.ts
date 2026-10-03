import { safeFetch, UnsafeUrlError } from '../../utils/safeFetch';

/** How long one Web API call may take before the server is reported unreachable. */
const SONAR_TIMEOUT_MS = 10_000;

/** What went wrong talking to SonarQube, in the words the screen shows. */
export type SonarProblem = 'UNAUTHORIZED' | 'NOT_FOUND' | 'UNREACHABLE' | 'ERROR';

export class SonarError extends Error {
  constructor(
    readonly problem: SonarProblem,
    message: string,
  ) {
    super(message);
    this.name = 'SonarError';
  }
}

/** The parts of a stored config a request needs. */
export interface SonarTarget {
  hostUrl: string;
  token: string;
}

type AuthScheme = 'bearer' | 'basic';
type Params = Record<string, string | number>;

/** The server's base URL with any trailing slash removed, so paths join cleanly. */
export function baseUrl(hostUrl: string): string {
  return hostUrl.trim().replace(/\/+$/, '');
}

/**
 * SonarQube 10+ and SonarCloud take a user token as a Bearer token; older SonarQube only as
 * the HTTP Basic user name with an empty password. Bearer is tried first.
 */
function authorization(token: string, scheme: AuthScheme): string {
  if (scheme === 'bearer') {
    return `Bearer ${token}`;
  }
  const credentials = `${token}:`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/** The failure an HTTP status means, or null for a success. */
function problemFor(status: number): SonarError | null {
  if (status === 401) {
    return new SonarError('UNAUTHORIZED', 'SonarQube did not accept the token.');
  }
  if (status === 403) {
    return new SonarError('UNAUTHORIZED', 'The token has no permission to browse this project.');
  }
  if (status === 404) {
    return new SonarError('NOT_FOUND', 'SonarQube has no project with that key.');
  }
  if (status < 200 || status >= 300) {
    return new SonarError('ERROR', `SonarQube answered with HTTP ${status}.`);
  }
  return null;
}

/**
 * A read-only SonarQube Web API client for one configured server. It remembers which
 * authorization scheme worked, so a Basic-only server costs one extra request, not one per call.
 * Requests go through safeFetch: https only, public addresses only, bounded time and size.
 */
export class SonarClient {
  private scheme: AuthScheme = 'bearer';

  constructor(private readonly target: SonarTarget) {}

  private async send(path: string, params: Params): Promise<Response> {
    const url = new URL(`${baseUrl(this.target.hostUrl)}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
    try {
      return await safeFetch(
        url.toString(),
        {
          headers: {
            Accept: 'application/json',
            Authorization: authorization(this.target.token, this.scheme),
          },
        },
        { timeoutMs: SONAR_TIMEOUT_MS },
      );
    } catch (error) {
      const message =
        error instanceof UnsafeUrlError
          ? error.message
          : `SonarQube at ${baseUrl(this.target.hostUrl)} could not be reached.`;
      throw new SonarError('UNREACHABLE', message);
    }
  }

  /** GETs a Web API path and returns its JSON, or throws a SonarError saying why not. */
  async get<T>(path: string, params: Params = {}): Promise<T> {
    let response = await this.send(path, params);
    if (response.status === 401 && this.scheme === 'bearer') {
      this.scheme = 'basic';
      response = await this.send(path, params);
    }
    const problem = problemFor(response.status);
    if (problem) {
      throw problem;
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new SonarError('ERROR', 'SonarQube answered with something that is not JSON.');
    }
  }
}
