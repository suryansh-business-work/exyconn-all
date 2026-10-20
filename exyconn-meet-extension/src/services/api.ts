import type { TypedDocumentString } from '../graphql/generated';
import { isRecord } from '../storage/area';
import { ApiError, fetchWithTimeout, readJson, type FetchLike } from './http';

export interface GraphqlClientOptions {
  apiUrl: string;
  fetchImpl: FetchLike;
  getAccessToken: () => Promise<string | null>;
  /** Exchanges the refresh token; null means the sign-in is gone. */
  refreshAccessToken: () => Promise<string | null>;
  onSignedOut: () => Promise<void>;
  timeoutMs?: number;
}

export interface RequestOptions {
  /** Send without a token when signed out (only public fields such as reportClientLogs). */
  allowAnonymous?: boolean;
}

export interface GraphqlClient {
  request<TResult, TVariables>(
    document: TypedDocumentString<TResult, TVariables>,
    variables: TVariables,
    options?: RequestOptions,
  ): Promise<TResult>;
}

interface RawResult {
  status: number;
  body: unknown;
}

function firstError(body: unknown): { message: string; code: string } | null {
  if (!isRecord(body) || !Array.isArray(body.errors) || body.errors.length === 0) {
    return null;
  }
  const error: unknown = body.errors[0];
  const message = isRecord(error) && typeof error.message === 'string' ? error.message : '';
  const extensions = isRecord(error) && isRecord(error.extensions) ? error.extensions : {};
  const code = typeof extensions.code === 'string' ? extensions.code : 'GRAPHQL_ERROR';
  return { message: message || 'The request failed', code };
}

function isUnauthenticated(result: RawResult): boolean {
  return result.status === 401 || firstError(result.body)?.code === 'UNAUTHENTICATED';
}

function unwrap<T>(result: RawResult): T {
  const error = firstError(result.body);
  if (error !== null) {
    throw new ApiError(error.message, error.code, result.status);
  }
  if (result.status < 200 || result.status >= 300 || !isRecord(result.body)) {
    throw new ApiError(`The server answered ${result.status}`, 'HTTP_ERROR', result.status);
  }
  if (!isRecord(result.body.data)) {
    throw new ApiError('The server sent no data', 'NO_DATA', result.status);
  }
  return result.body.data as T;
}

/**
 * A tiny typed GraphQL client: posts `{ query, variables }` with the bearer token, refreshes
 * once on UNAUTHENTICATED and signs out if that does not help. No Apollo, no cache — the
 * extension renders a handful of small, short-lived queries.
 */
export function createGraphqlClient(options: GraphqlClientOptions): GraphqlClient {
  const endpoint = `${options.apiUrl}/graphql`;

  async function post(query: string, variables: unknown, token: string | null): Promise<RawResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetchWithTimeout(
      options.fetchImpl,
      endpoint,
      { method: 'POST', headers, body: JSON.stringify({ query, variables }) },
      options.timeoutMs,
    );
    return { status: response.status, body: await readJson(response) };
  }

  async function signedOut(): Promise<never> {
    await options.onSignedOut();
    throw new ApiError('You are signed out', 'UNAUTHENTICATED', 401);
  }

  return {
    async request(document, variables, requestOptions = {}) {
      const query = document.toString();
      const token = await options.getAccessToken();
      if (token === null && !requestOptions.allowAnonymous) {
        throw new ApiError('You are signed out', 'UNAUTHENTICATED', 401);
      }
      let result = await post(query, variables, token);
      if (token !== null && isUnauthenticated(result)) {
        const fresh = await options.refreshAccessToken();
        if (fresh === null) {
          return signedOut();
        }
        result = await post(query, variables, fresh);
        if (isUnauthenticated(result)) {
          return signedOut();
        }
      }
      return unwrap(result);
    },
  };
}
