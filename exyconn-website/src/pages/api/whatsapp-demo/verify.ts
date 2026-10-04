import type { APIRoute } from "astro";
import { verifyDemoCode } from "../../../lib/portal";
import { demoFailure, json, readTextFields } from "../../../lib/whatsapp-demo/api";

/**
 * Step two of the live WhatsApp demo: the code from the email, exchanged for the visitor's
 * demo-only pass. Guesses are limited by the portal — five per code and more per address.
 */
export const POST: APIRoute = async ({ request }) => {
  const { email, code } = readTextFields(await request.json().catch(() => null), ["email", "code"]);
  if (email === "" || code === "") {
    return json({ error: "refused", message: "Enter the six-digit code from the email." }, 400);
  }
  try {
    const signIn = await verifyDemoCode(email, code);
    return json(signIn, 200);
  } catch (err) {
    return demoFailure(err, "code check");
  }
};
