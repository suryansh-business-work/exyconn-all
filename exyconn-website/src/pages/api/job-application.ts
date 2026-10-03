import type { APIRoute } from "astro";
import { submitJobApplication } from "../../lib/career/apply";
import { readResume } from "../../lib/career/application";
import { readFormPayload } from "../../lib/form-payload";
import { PortalRequestError } from "../../lib/portal";
import { allowVisitorForm, visitorAddress } from "../../lib/visitor-limit";

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

/** The portal's code for a request it refused as bad input — here, a résumé it would not take. */
const BAD_INPUT = "BAD_USER_INPUT";

/**
 * A job application with its résumé. Same rules as /api/form-submit — one visitor's
 * allowance, the captcha checked by the portal — plus the file, which the portal hosts and
 * links from the HR applicant. Answers 400 `captcha` for a wrong answer and 400 `resume` for
 * a file the portal will not take, so the form can say which.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!allowVisitorForm(visitorAddress(request))) {
    return json({ error: "Too many submissions. Please try again later." }, 429, {
      "Retry-After": "600",
    });
  }

  try {
    const body: unknown = await request.json();
    const payload = readFormPayload(body);
    if (!payload) {
      return json({ error: "captcha", message: "Please answer the security question." }, 400);
    }
    const resume = readResume((body as Record<string, unknown>).resume);
    if (!resume) {
      return json({ error: "resume", message: "Please attach your résumé." }, 400);
    }
    await submitJobApplication(payload.data, resume, payload.captcha);
    return json({ success: true }, 200);
  } catch (err) {
    if (err instanceof PortalRequestError && err.codes.includes("CAPTCHA_FAILED")) {
      return json({ error: "captcha", message: "That answer was not right." }, 400);
    }
    if (err instanceof PortalRequestError && err.codes.includes(BAD_INPUT)) {
      return json({ error: "resume", message: err.message }, 400);
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Job application failed:", message);
    return json({ error: "Failed to submit application" }, 500);
  }
};
