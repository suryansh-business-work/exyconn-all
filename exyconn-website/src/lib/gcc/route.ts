import { LIMITS } from "@exyconn/gcc-cost";
import { PortalRequestError } from "../portal";
import { createVisitorLimit } from "../visitor-limit";

/**
 * What the calculator's API routes (src/pages/api/gcc/*) share: the per-visitor allowances,
 * the JSON answer and how a portal refusal reaches the browser. Every failure body is
 * `{ error, message }`, `error` being one of the reasons src/lib/gcc/api.ts understands.
 */

const MINUTE = 60 * 1000;

/** Per-visitor allowances: the portal sees every visitor as this server, so these are the real limits. */
export const gccLimits = {
  email: createVisitorLimit({ points: 5, windowMs: 60 * MINUTE }),
  shareCreate: createVisitorLimit({ points: 10, windowMs: 60 * MINUTE }),
  shareRead: createVisitorLimit({ points: 60, windowMs: 10 * MINUTE }),
  fxRates: createVisitorLimit({ points: 30, windowMs: 10 * MINUTE }),
};

/** Test seam: forgets every visitor on every limit. */
export function resetGccLimits(): void {
  for (const limit of Object.values(gccLimits)) {
    limit.reset();
  }
}

export const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });

export const tooMany = () =>
  json({ error: "rate-limited", message: "Too many requests. Please try again later." }, 429, {
    "Retry-After": "600",
  });

export const invalid = (message: string) => json({ error: "invalid", message }, 400);

const PORTAL_PREFIX = "Portal request failed: ";
const portalSentence = (err: PortalRequestError) => err.message.replace(PORTAL_PREFIX, "");

/** A portal refusal the visitor can act on, or null for anything that is the service failing. */
function refusal(err: PortalRequestError): Response | null {
  if (err.codes.includes("CAPTCHA_FAILED")) {
    return json(
      { error: "captcha", message: "That answer was not right. Please try the new question." },
      400
    );
  }
  if (err.codes.includes("TOO_MANY_REQUESTS")) {
    return json({ error: "rate-limited", message: portalSentence(err) }, 429);
  }
  if (err.codes.includes("BAD_USER_INPUT")) {
    return invalid(portalSentence(err));
  }
  if (err.codes.includes("EMAIL_UNAVAILABLE")) {
    return json({ error: "unavailable", message: portalSentence(err) }, 503);
  }
  return null;
}

/** Turns a failed portal call into the browser's answer; anything unexpected is logged. */
export function gccFailure(err: unknown, what: string): Response {
  const known = err instanceof PortalRequestError ? refusal(err) : null;
  if (known) {
    return known;
  }
  console.error(`GCC ${what} failed:`, err instanceof Error ? err.message : err);
  return json(
    {
      error: "unavailable",
      message: "The service is not available right now. Please try again later.",
    },
    503
  );
}

/** Room for the other fields beside the largest estimate the portal accepts. */
const MAX_BODY_BYTES = LIMITS.payloadBytes + 16 * 1024;

/** The posted JSON object, or null when it is too large, not JSON or not an object. */
export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const declared = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (declared > MAX_BODY_BYTES) {
    return null;
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return null;
  }
  try {
    const body: unknown = JSON.parse(text);
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const textField = (body: Record<string, unknown>, key: string): string => {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
};

/** A share token or revoke key: 64 lowercase hex characters. */
export const SHARE_SECRET = /^[a-f\d]{64}$/;
