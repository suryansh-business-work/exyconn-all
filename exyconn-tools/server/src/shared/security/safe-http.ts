import http from "node:http";
import https from "node:https";
import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { assertSafeUrl, publicOnlyLookup } from "./network-guard";

const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_CONTENT_BYTES = 10 * 1024 * 1024;
const MAX_BODY_BYTES = 1024 * 1024;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const httpAgent = new http.Agent({ lookup: publicOnlyLookup });
const httpsAgent = new https.Agent({ lookup: publicOnlyLookup });

export type SafeRequestConfig = Omit<
  AxiosRequestConfig,
  | "url"
  | "httpAgent"
  | "httpsAgent"
  | "proxy"
  | "lookup"
  | "beforeRedirect"
  | "socketPath"
>;

export type SafeResponse<T> = AxiosResponse<T> & { finalUrl: string };

const defaultValidateStatus = (status: number) => status >= 200 && status < 300;

function statusError<T>(response: AxiosResponse<T>): AxiosError<T> {
  const code =
    response.status >= 500
      ? AxiosError.ERR_BAD_RESPONSE
      : AxiosError.ERR_BAD_REQUEST;
  return new AxiosError(
    `Request failed with status code ${response.status}`,
    code,
    response.config,
    response.request,
    response,
  );
}

/**
 * An axios request to a user-supplied URL. Redirects are followed by hand (at most five)
 * so every hop is re-validated; connections only go to public addresses; the response
 * size and time are capped. Behaves like axios otherwise, including throwing on a status
 * rejected by `validateStatus`.
 */
export async function safeRequest<T = unknown>(
  rawUrl: string,
  config: SafeRequestConfig = {},
): Promise<SafeResponse<T>> {
  const { maxRedirects, validateStatus, ...rest } = config;
  const redirectLimit = Math.min(maxRedirects ?? MAX_REDIRECTS, MAX_REDIRECTS);
  const accept = validateStatus ?? defaultValidateStatus;
  let url = assertSafeUrl(rawUrl).href;

  for (let hop = 0; ; hop++) {
    const response = await axios.request<T>({
      timeout: DEFAULT_TIMEOUT_MS,
      maxContentLength: DEFAULT_MAX_CONTENT_BYTES,
      ...rest,
      url,
      maxBodyLength: MAX_BODY_BYTES,
      maxRedirects: 0,
      proxy: false,
      httpAgent,
      httpsAgent,
      validateStatus: () => true,
    });

    const location = response.headers.location;
    const isRedirect =
      REDIRECT_STATUSES.has(response.status) && typeof location === "string";
    if (isRedirect && hop < redirectLimit) {
      url = assertSafeUrl(new URL(location, url).href).href;
      continue;
    }
    if (!accept(response.status)) {
      throw statusError(response);
    }
    return Object.assign(response, { finalUrl: url });
  }
}
