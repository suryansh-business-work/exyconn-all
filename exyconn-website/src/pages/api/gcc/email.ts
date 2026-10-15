import type { APIRoute } from "astro";
import { EMAIL } from "@exyconn/regex";
import { emailGccEstimate } from "../../../lib/portal";
import { visitorAddress } from "../../../lib/visitor-limit";
import {
  gccFailure,
  gccLimits,
  invalid,
  json,
  readBody,
  textField,
  tooMany,
} from "../../../lib/gcc/route";

/**
 * Emails an estimate as a PDF. The portal recomputes the figures, renders the PDF, checks the
 * security question and limits each recipient; this route limits each visitor.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!gccLimits.email.allow(visitorAddress(request))) {
    return tooMany();
  }
  const body = await readBody(request);
  if (!body) {
    return invalid("The estimate could not be read.");
  }
  const to = textField(body, "to");
  const token = textField(body, "captchaToken");
  const answer = textField(body, "captchaAnswer");
  if (!EMAIL.test(to)) {
    return invalid("Enter a valid email address.");
  }
  if (token === "" || answer === "") {
    return json({ error: "captcha", message: "Please answer the security question." }, 400);
  }
  try {
    const sentTo = await emailGccEstimate(
      { to, estimateJson: JSON.stringify(body.estimate), note: textField(body, "note") },
      { token, answer }
    );
    return json({ sentTo }, 200);
  } catch (err) {
    return gccFailure(err, "estimate email");
  }
};
