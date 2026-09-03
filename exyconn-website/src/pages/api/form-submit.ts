import type { APIRoute } from "astro";
import { submitForm } from "../../lib/portal";

/** Form identifiers the portal accepts. Mirrors SUBMISSION_FORM_TYPES on the server. */
const FORM_TYPES = new Set([
  "contact",
  "grievance",
  "legal",
  "career",
  "india-offer",
  "newsletter",
  "job-application",
]);

/**
 * Every public form funnels through here.
 *
 * The portal owns both the durable record and the notification email — the SMTP
 * account lives in the database and is managed from Admin › Environment
 * Variables, so the website holds no mail credentials of its own.
 */
export const POST: APIRoute = async ({ request }) => {
  let formType = "";

  try {
    const body = await request.json();
    const parsed = body as { formType: string } & Record<string, string>;
    const { formType: type, ...data } = parsed;
    formType = type;

    if (!formType || !FORM_TYPES.has(formType)) {
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
    return new Response(JSON.stringify({ error: "Failed to submit form", detail: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
