import type { APIRoute } from "astro";
import { getWebsiteFormTypes, PortalRequestError, submitForm } from "../../lib/portal";
import { readFormPayload } from "../../lib/form-payload";
import { allowVisitorForm, visitorAddress } from "../../lib/visitor-limit";

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

/**
 * Every public form funnels through here.
 *
 * The portal owns both the durable record and the notification email — the SMTP
 * account lives in the database and is managed from Admin › Environment
 * Variables, so the website holds no mail credentials of its own. The portal also
 * checks the security question, so a request that skips this page is refused too.
 */
export const POST: APIRoute = async ({ request }) => {
  let formType = "";

  if (!allowVisitorForm(visitorAddress(request))) {
    return json({ error: "Too many submissions. Please try again later." }, 429, {
      "Retry-After": "600",
    });
  }

  try {
    const payload = readFormPayload(await request.json());
    if (!payload) {
      return json({ error: "captcha", message: "Please answer the security question." }, 400);
    }
    formType = payload.formType;

    const allowed = await getWebsiteFormTypes();
    if (!formType || !allowed.has(formType)) {
      return json({ error: "Invalid form type" }, 400);
    }

    await submitForm(formType, payload.data, payload.captcha);
    return json({ success: true }, 200);
  } catch (err) {
    if (err instanceof PortalRequestError && err.codes.includes("CAPTCHA_FAILED")) {
      return json(
        { error: "captcha", message: "That answer was not right. Please try the new question." },
        400
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Form submission failed (${formType}):`, message);
    return json({ error: "Failed to submit form" }, 500);
  }
};
