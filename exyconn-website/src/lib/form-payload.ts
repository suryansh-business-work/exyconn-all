import type { CaptchaAnswer } from "./portal";

/** What the browser posts to /api/form-submit, taken apart. */
export interface FormPayload {
  formType: string;
  captcha: CaptchaAnswer;
  /** The form's own fields — what is stored. The captcha is never part of it. */
  data: Record<string, string>;
}

const CAPTCHA_KEYS = new Set(["formType", "captchaToken", "captchaAnswer"]);

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * Splits a posted form into its type, its captcha answer and its fields. Returns null when the
 * captcha is missing: every form carries one, so a post without it did not come from the site.
 * Only text values are kept — a form field is text, anything else was not sent by our forms.
 */
export function readFormPayload(body: unknown): FormPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const token = text(record.captchaToken);
  const answer = text(record.captchaAnswer);
  if (token === "" || answer.trim() === "") return null;
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!CAPTCHA_KEYS.has(key) && typeof value === "string") data[key] = value;
  }
  return { formType: text(record.formType), captcha: { token, answer }, data };
}
