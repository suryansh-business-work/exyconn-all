/** A security question from the portal, and the token its answer is checked against. */
export interface CaptchaChallenge {
  token: string;
  question: string;
}

/** What happened to a sent form: stored, or refused because the security answer was wrong. */
export type SendOutcome = "sent" | "captcha";

/** Loads a fresh question. Each one is good for one answer, so a new one follows every send. */
export async function fetchCaptcha(): Promise<CaptchaChallenge> {
  const res = await fetch("/api/captcha", { cache: "no-store" });
  if (!res.ok) throw new Error(`The security question could not be loaded (${res.status})`);
  return (await res.json()) as CaptchaChallenge;
}

/**
 * Hands a website form to the server route that stores it. Resolves "captcha" when the
 * security answer was refused — the caller shows a new question — and throws on any other
 * failure.
 */
export async function postFormSubmission(
  formType: string,
  payload: Record<string, unknown>,
  captcha: { token: string; answer: string }
): Promise<SendOutcome> {
  const res = await fetch("/api/form-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      formType,
      ...payload,
      captchaToken: captcha.token,
      captchaAnswer: captcha.answer,
    }),
  });
  if (res.ok) return "sent";
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 400 && body.error === "captcha") return "captcha";
  throw new Error(`Form submission failed with status ${res.status}`);
}
