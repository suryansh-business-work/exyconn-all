/** What the calculator's API routes share: answers, portal refusals, body reading and limits. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIMITS } from "@exyconn/gcc-cost";
import { PortalRequestError } from "../../../../src/lib/portal/client";
import {
  SHARE_SECRET,
  gccFailure,
  gccLimits,
  invalid,
  json,
  readBody,
  resetGccLimits,
  textField,
  tooMany,
} from "../../../../src/lib/gcc/route";

const answer = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});
const portalError = (code: string, sentence = "Too fast.") =>
  new PortalRequestError(`Portal request failed: ${sentence}`, [code]);
const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://exyconn.com/api/gcc/x", { method: "POST", body, headers });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("answers", () => {
  it("sends JSON that is never cached, with extra headers", async () => {
    const response = json({ ok: true }, 201, { "X-Test": "1" });
    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Test")).toBe("1");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("asks a visitor over the limit to come back in ten minutes", async () => {
    const response = tooMany();
    expect(response.headers.get("Retry-After")).toBe("600");
    expect(await answer(response)).toEqual({
      status: 429,
      body: { error: "rate-limited", message: "Too many requests. Please try again later." },
    });
  });

  it("explains an invalid request", async () => {
    expect(await answer(invalid("Bad."))).toEqual({
      status: 400,
      body: { error: "invalid", message: "Bad." },
    });
  });
});

describe("gccFailure", () => {
  it.each([
    [
      "CAPTCHA_FAILED",
      400,
      { error: "captcha", message: "That answer was not right. Please try the new question." },
    ],
    ["TOO_MANY_REQUESTS", 429, { error: "rate-limited", message: "Too fast." }],
    ["BAD_USER_INPUT", 400, { error: "invalid", message: "Too fast." }],
    ["EMAIL_UNAVAILABLE", 503, { error: "unavailable", message: "Too fast." }],
  ])("turns the portal's %s into an answer the visitor can act on", async (code, status, body) => {
    expect(await answer(gccFailure(portalError(code), "email"))).toEqual({ status, body });
    expect(console.error).not.toHaveBeenCalled();
  });

  const UNAVAILABLE = {
    status: 503,
    body: {
      error: "unavailable",
      message: "The service is not available right now. Please try again later.",
    },
  };

  it("logs any other portal error and reports the service unavailable", async () => {
    expect(await answer(gccFailure(portalError("INTERNAL"), "share link"))).toEqual(UNAVAILABLE);
    expect(console.error).toHaveBeenCalledWith(
      "GCC share link failed:",
      "Portal request failed: Too fast."
    );
  });

  it("logs a thrown value that is not an Error as it is", async () => {
    expect(await answer(gccFailure("boom", "email"))).toEqual(UNAVAILABLE);
    expect(console.error).toHaveBeenCalledWith("GCC email failed:", "boom");
  });
});

describe("readBody", () => {
  it("reads a JSON object", async () => {
    expect(await readBody(post('{"a":1}'))).toEqual({ a: 1 });
  });

  it.each([
    ["broken JSON", "{"],
    ["an array", "[1]"],
    ["null", "null"],
    ["a number", "3"],
  ])("refuses %s", async (_what, body) => {
    expect(await readBody(post(body))).toBeNull();
  });

  it("refuses a body declared or sent larger than the largest estimate allows", async () => {
    const limit = LIMITS.payloadBytes + 16 * 1024;
    expect(await readBody(post("{}", { "content-length": String(limit + 1) }))).toBeNull();
    expect(await readBody(post(`{"a":"${"x".repeat(limit)}"}`))).toBeNull();
  });

  it("reads a body right at the limit", async () => {
    const limit = LIMITS.payloadBytes + 16 * 1024;
    const text = `{"a":"${"x".repeat(limit - 8)}"}`;
    expect(text).toHaveLength(limit);
    expect(await readBody(post(text))).toEqual({ a: "x".repeat(limit - 8) });
  });
});

describe("fields and secrets", () => {
  it("reads a trimmed text field, or empty for anything that is not text", () => {
    expect(textField({ a: "  hi " }, "a")).toBe("hi");
    expect(textField({ a: 3 }, "a")).toBe("");
    expect(textField({}, "a")).toBe("");
  });

  it("accepts only 64 lowercase hex characters as a share secret", () => {
    expect(SHARE_SECRET.test("a1".repeat(32))).toBe(true);
    expect(SHARE_SECRET.test("A1".repeat(32))).toBe(false);
    expect(SHARE_SECRET.test("a1".repeat(31))).toBe(false);
    expect(SHARE_SECRET.test(`${"a1".repeat(32)}0`)).toBe(false);
  });

  it("resets every visitor allowance", () => {
    for (let i = 0; i < 5; i += 1) {
      gccLimits.email.allow("v");
    }
    expect(gccLimits.email.allow("v")).toBe(false);
    resetGccLimits();
    expect(gccLimits.email.allow("v")).toBe(true);
  });
});
