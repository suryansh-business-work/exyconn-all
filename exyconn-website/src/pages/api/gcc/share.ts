import type { APIRoute } from "astro";
import { createGccShare, getSharedGccEstimate, revokeGccShare } from "../../../lib/portal";
import { visitorAddress } from "../../../lib/visitor-limit";
import {
  SHARE_SECRET,
  gccFailure,
  gccLimits,
  invalid,
  json,
  readBody,
  textField,
  tooMany,
} from "../../../lib/gcc/route";

const NOT_FOUND = { error: "not-found", message: "This link has expired or was removed." };

async function create(body: Record<string, unknown>, visitor: string): Promise<Response> {
  if (!gccLimits.shareCreate.allow(visitor)) {
    return tooMany();
  }
  const token = textField(body, "captchaToken");
  const answer = textField(body, "captchaAnswer");
  if (token === "" || answer === "") {
    return json({ error: "captcha", message: "Please answer the security question." }, 400);
  }
  if (body.consent !== true || typeof body.expiresInDays !== "number") {
    return invalid("Agree to the estimate being stored and choose when the link expires.");
  }
  const link = await createGccShare(
    {
      estimateJson: JSON.stringify(body.estimate),
      expiresInDays: body.expiresInDays,
      consent: true,
    },
    { token, answer }
  );
  return json(link, 200);
}

async function read(body: Record<string, unknown>, visitor: string): Promise<Response> {
  if (!gccLimits.shareRead.allow(visitor)) {
    return tooMany();
  }
  const token = textField(body, "token");
  const shared = SHARE_SECRET.test(token) ? await getSharedGccEstimate(token) : null;
  return shared ? json(shared, 200) : json(NOT_FOUND, 404);
}

async function revoke(body: Record<string, unknown>, visitor: string): Promise<Response> {
  if (!gccLimits.shareRead.allow(visitor)) {
    return tooMany();
  }
  const token = textField(body, "token");
  const revokeKey = textField(body, "revokeKey");
  const valid = SHARE_SECRET.test(token) && SHARE_SECRET.test(revokeKey);
  const revoked = valid && (await revokeGccShare(token, revokeKey));
  return revoked ? json({}, 200) : json(NOT_FOUND, 404);
}

const ACTIONS: Readonly<
  Record<string, (body: Record<string, unknown>, visitor: string) => Promise<Response>>
> = { create, read, revoke };

/**
 * Read-only share links to an estimate: `create` (security question and consent), `read` and
 * `revoke` (with the key handed out at creation). There is deliberately no update.
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await readBody(request);
  const action = body ? ACTIONS[textField(body, "action")] : undefined;
  if (!body || !action) {
    return invalid("The request could not be read.");
  }
  try {
    return await action(body, visitorAddress(request));
  } catch (err) {
    return gccFailure(err, "share link");
  }
};
