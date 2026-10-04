import { PortalRequestError } from "../portal";

/** A JSON answer from one of the WhatsApp demo routes. */
export const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });

/** Portal refusals worth showing the visitor as written: a wrong code, a limit, a bad field. */
const SHOWN_CODES = new Set(["BAD_USER_INPUT", "TOO_MANY_REQUESTS"]);
const PORTAL_PREFIX = "Portal request failed: ";

/**
 * Turns a failed portal call into the answer the browser gets: the portal's own sentence for
 * something the visitor can fix ("That code is not right."), a new security question for a
 * wrong answer, and a generic failure — logged — for anything else.
 */
export function demoFailure(err: unknown, what: string): Response {
  if (err instanceof PortalRequestError) {
    if (err.codes.includes("CAPTCHA_FAILED")) {
      return json(
        { error: "captcha", message: "That answer was not right. Please try the new question." },
        400
      );
    }
    if (err.codes.some((code) => SHOWN_CODES.has(code))) {
      return json({ error: "refused", message: err.message.replace(PORTAL_PREFIX, "") }, 400);
    }
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error(`WhatsApp demo ${what} failed:`, message);
  return json(
    { error: "failed", message: "Something went wrong. Please try again in a minute." },
    500
  );
}

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** The posted body's text fields; anything that is not text was not sent by our form. */
export function readTextFields(body: unknown, keys: readonly string[]): Record<string, string> {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  return Object.fromEntries(keys.map((key) => [key, text(record[key])]));
}
