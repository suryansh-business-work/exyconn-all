import { fxRateSchema, parseEstimateJson, type Estimate, type FxRate } from "@exyconn/gcc-cost";

/**
 * The calculator's calls to its own API routes (src/pages/api/gcc/*). None of these throws:
 * every outcome is a result, and a failure carries a reason the UI can act on and a sentence
 * it can show. Network errors, 5xx answers and a portal that is down are all "unavailable".
 */

export interface CaptchaAnswer {
  token: string;
  answer: string;
}
export type ApiFailureReason = "unavailable" | "captcha" | "rate-limited" | "invalid" | "not-found";
export interface ApiFailure {
  ok: false;
  reason: ApiFailureReason;
  message: string;
}
export type ApiResult<T> = ({ ok: true } & T) | ApiFailure;

type Body = Record<string, unknown>;

const UNAVAILABLE = "The service is not available right now. Please try again later.";
const RATE_LIMITED = "Too many requests. Please wait a few minutes and try again.";
const INVALID = "The request could not be completed. Check the details and try again.";
const UNREADABLE = "This shared estimate could not be read.";
const REASONS: ReadonlySet<string> = new Set(["captcha", "invalid", "not-found"]);

const failure = (reason: ApiFailureReason, message: string): ApiFailure => ({
  ok: false,
  reason,
  message,
});

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** The failure an answer stands for: by status first, then by the reason the route named. */
function failureOf(status: number, body: Body | null): ApiFailure {
  const message = text(body?.message);
  if (status === 429) {
    return failure("rate-limited", message || RATE_LIMITED);
  }
  if (status >= 500) {
    return failure("unavailable", message || UNAVAILABLE);
  }
  const reason = text(body?.error);
  if (REASONS.has(reason)) {
    return failure(reason as ApiFailureReason, message || INVALID);
  }
  return failure("invalid", message || INVALID);
}

const parseBody = async (response: Response): Promise<Body | null> => {
  try {
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null ? (body as Body) : null;
  } catch {
    return null;
  }
};

/** One call: the answer's body when it succeeded, or the failure it stands for. */
async function call(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; body: Body } | ApiFailure> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    return failure("unavailable", UNAVAILABLE);
  }
  const body = await parseBody(response);
  if (response.ok && body) {
    return { ok: true, body };
  }
  if (response.ok) {
    return failure("unavailable", UNAVAILABLE);
  }
  return failureOf(response.status, body);
}

const post = (path: string, payload: Body) =>
  call(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export async function emailEstimate(input: {
  to: string;
  estimate: Estimate;
  note: string;
  captcha: CaptchaAnswer;
}): Promise<ApiResult<{ sentTo: string }>> {
  const result = await post("/api/gcc/email", {
    to: input.to,
    estimate: input.estimate,
    note: input.note,
    captchaToken: input.captcha.token,
    captchaAnswer: input.captcha.answer,
  });
  return result.ok ? { ok: true, sentTo: text(result.body.sentTo) } : result;
}

export async function createShareLink(input: {
  estimate: Estimate;
  expiresInDays: number;
  captcha: CaptchaAnswer;
}): Promise<ApiResult<{ token: string; revokeKey: string; expiresAt: string }>> {
  const result = await post("/api/gcc/share", {
    action: "create",
    estimate: input.estimate,
    expiresInDays: input.expiresInDays,
    consent: true,
    captchaToken: input.captcha.token,
    captchaAnswer: input.captcha.answer,
  });
  if (!result.ok) {
    return result;
  }
  const { token, revokeKey, expiresAt } = result.body;
  return { ok: true, token: text(token), revokeKey: text(revokeKey), expiresAt: text(expiresAt) };
}

/** The shared estimate, validated against the schema here too before the UI sees it. */
export async function readSharedEstimate(
  token: string
): Promise<ApiResult<{ estimate: Estimate; expiresAt: string }>> {
  const result = await post("/api/gcc/share", { action: "read", token });
  if (!result.ok) {
    return result;
  }
  const parsed = parseEstimateJson(text(result.body.estimateJson));
  if (!parsed.ok) {
    return failure("invalid", UNREADABLE);
  }
  return { ok: true, estimate: parsed.estimate, expiresAt: text(result.body.expiresAt) };
}

export async function revokeShareLink(
  token: string,
  revokeKey: string
): Promise<ApiResult<Record<never, never>>> {
  const result = await post("/api/gcc/share", { action: "revoke", token, revokeKey });
  return result.ok ? { ok: true } : result;
}

export async function fetchFxRates(
  currencies: readonly string[]
): Promise<ApiResult<{ rates: FxRate[] }>> {
  const query = new URLSearchParams({ currencies: currencies.join(",") });
  const result = await call(`/api/gcc/fx-rates?${query.toString()}`);
  if (!result.ok) {
    return result;
  }
  const rates = fxRateSchema.array().safeParse(result.body.rates);
  return rates.success ? { ok: true, rates: rates.data } : failure("unavailable", UNAVAILABLE);
}

/** Every currency an estimate can be shown in, as 3-letter codes. */
export async function fetchCurrencies(): Promise<ApiResult<{ currencies: string[] }>> {
  const result = await call("/api/gcc/fx-currencies");
  if (!result.ok) {
    return result;
  }
  const codes = result.body.currencies;
  const valid =
    Array.isArray(codes) && codes.every((code) => typeof code === "string" && code.length === 3);
  return valid ? { ok: true, currencies: codes as string[] } : failure("unavailable", UNAVAILABLE);
}
