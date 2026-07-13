import type { APIRoute } from "astro";
import {
  sendMail,
  contactEmail,
  grievanceEmail,
  legalEmail,
  careerEmail,
  indiaOfferEmail,
  newsletterEmail,
  jobApplicationEmail,
} from "../../lib/mailer";
import { submitForm } from "../../lib/portal";

const FORM_HANDLERS: Record<
  string,
  (d: Record<string, string>) => { subject: string; html: string; replyTo?: string }
> = {
  contact: (d) => ({
    subject: `Contact: ${d.subject} — ${d.firstName} ${d.lastName}`,
    html: contactEmail(d),
    replyTo: d.email,
  }),
  grievance: (d) => ({
    subject: `Grievance: ${d.subject} — ${d.name}`,
    html: grievanceEmail(d),
    replyTo: d.email,
  }),
  legal: (d) => ({
    subject: `Legal Request: ${d.legalType} — ${d.name}`,
    html: legalEmail(d),
    replyTo: d.email,
  }),
  career: (d) => ({
    subject: `Job Application: ${d.name}`,
    html: careerEmail(d),
    replyTo: d.email,
  }),
  "india-offer": (d) => ({
    subject: `India Offer: ${d.plan} — ${d.name}`,
    html: indiaOfferEmail(d),
    replyTo: d.email,
  }),
  newsletter: (d) => ({
    subject: `Newsletter Subscription: ${d.email}`,
    html: newsletterEmail(d),
    replyTo: d.email,
  }),
  "job-application": (d) => ({
    subject: `Job Application: ${d.jobTitle} — ${d.firstName} ${d.lastName}`,
    html: jobApplicationEmail(d),
    replyTo: d.email,
  }),
};

/**
 * Every public form funnels through here.
 *
 * The portal submission is the durable record, so it is written FIRST — if it fails the
 * request fails and the visitor can safely retry without having triggered a duplicate
 * email. The notification email is then best-effort: once the submission is stored the
 * team can see it in the portal (Website > Form Submissions), so a mail outage must not
 * make the visitor re-submit and create a duplicate record.
 */
export const POST: APIRoute = async ({ request }) => {
  let formType = "";

  try {
    const body = await request.json();
    const parsed = body as { formType: string } & Record<string, string>;
    const { formType: type, ...data } = parsed;
    formType = type;

    const handler = FORM_HANDLERS[formType];
    if (!formType || !handler) {
      return new Response(JSON.stringify({ error: "Invalid form type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await submitForm(formType, data);

    const { subject, html, replyTo } = handler(data);
    try {
      await sendMail({ subject, html, replyTo });
    } catch (mailError) {
      const detail = mailError instanceof Error ? mailError.message : "Unknown error";
      console.error(`Submission ${formType} stored, but notification email failed:`, detail);
    }

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
