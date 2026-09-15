import type { APIRoute } from "astro";
import { getWebsiteFormTypes, submitForm } from "../../lib/portal";
import { allowVisitorForm, visitorAddress } from "../../lib/visitor-limit";

/**
 * Every public form funnels through here.
 *
 * The portal owns both the durable record and the notification email — the SMTP
 * account lives in the database and is managed from Admin › Environment
 * Variables, so the website holds no mail credentials of its own.
 */
export const POST: APIRoute = async ({ request }) => {
  let formType = "";

  if (!allowVisitorForm(visitorAddress(request))) {
    return new Response(
      JSON.stringify({ error: "Too many submissions. Please try again later." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "600" },
      }
    );
  }

  try {
    const body = await request.json();
    const parsed = body as { formType: string } & Record<string, string>;
    const { formType: type, ...data } = parsed;
    formType = type;

    const allowed = await getWebsiteFormTypes();

    if (!formType || !allowed.has(formType)) {
      return new Response(JSON.stringify({ error: "Invalid form type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await submitForm(formType, data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Form submission failed (${formType}):`, message);
    return new Response(JSON.stringify({ error: "Failed to submit form" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
