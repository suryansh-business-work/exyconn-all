import type { APIRoute } from "astro";
import { EMAIL } from "@exyconn/regex";
import { z } from "zod";
import { readFormPayload } from "../../lib/form-payload";
import { getCmsSite } from "../../lib/cms";
import { PortalRequestError, subscribeNewsletter } from "../../lib/portal";
import { allowVisitorForm, visitorAddress } from "../../lib/visitor-limit";

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

/** What a sign-up may carry: an address, an optional name and the page it came from. */
const signupSchema = z.object({
  email: z.string().trim().max(254).regex(EMAIL, "Enter a valid email address."),
  name: z.string().trim().max(120).default(""),
  source: z.string().trim().max(300).default(""),
});

/**
 * A newsletter sign-up from any page (components/newsletter/NewsletterSignup.astro). The
 * reader joins the subscribers of the site this host serves; the portal checks the security
 * answer, so a request that skips this route is refused too.
 */
export const POST: APIRoute = async ({ request }) => {
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
    const signup = signupSchema.safeParse(payload.data);
    if (!signup.success) {
      return json({ error: "invalid", message: signup.error.issues[0]?.message }, 400);
    }
    const { site } = await getCmsSite(request.headers.get("host") ?? "");
    await subscribeNewsletter({ site: site.slug, ...signup.data }, payload.captcha);
    return json({ success: true }, 200);
  } catch (err) {
    if (err instanceof PortalRequestError && err.codes.includes("CAPTCHA_FAILED")) {
      return json(
        { error: "captcha", message: "That answer was not right. Please try the new question." },
        400
      );
    }
    console.error("Newsletter sign-up failed:", err instanceof Error ? err.message : err);
    return json({ error: "Failed to sign up" }, 500);
  }
};
