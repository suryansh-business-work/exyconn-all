/** How long any one request to the portal may take before it is abandoned. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** An error the extension can show or log by its code without leaking the response body. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;

  constructor(message: string, code: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/**
 * `fetch` with a timeout, turning a network failure or a timeout into an `ApiError` so every
 * caller handles one kind of failure.
 */
export async function fetchWithTimeout(
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  try {
    return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The request timed out', 'TIMEOUT');
    }
    throw new ApiError('The network request failed', 'NETWORK');
  }
}

/** The JSON body of a response, or null when there is none or it is not JSON. */
export async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
