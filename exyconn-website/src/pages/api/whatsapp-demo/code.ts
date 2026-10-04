import type { APIRoute } from "astro";
import { requestDemoCode } from "../../../lib/portal";
import { allowVisitorForm, visitorAddress } from "../../../lib/visitor-limit";
import { demoFailure, json, readTextFields } from "../../../lib/whatsapp-demo/api";

const FIELDS = ["name", "email", "company", "phone", "captchaToken", "captchaAnswer"] as const;

/**
 * Step one of the live WhatsApp demo: files the visitor as a lead and has the portal email the
 * "thank you for your live demo" code. Limited per visitor here and per address by the portal,
 * which also checks the security question.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!allowVisitorForm(visitorAddress(request))) {
    return json({ error: "refused", message: "Too many requests. Please try again later." }, 429, {
      "Retry-After": "600",
    });
  }
  const fields = readTextFields(await request.json().catch(() => null), FIELDS);
  if (fields.captchaToken === "" || fields.captchaAnswer === "") {
    return json({ error: "captcha", message: "Please answer the security question." }, 400);
  }
  try {
    await requestDemoCode(
      { name: fields.name, email: fields.email, company: fields.company, phone: fields.phone },
      { token: fields.captchaToken, answer: fields.captchaAnswer }
    );
    return json({ success: true }, 200);
  } catch (err) {
    return demoFailure(err, "code request");
  }
};
