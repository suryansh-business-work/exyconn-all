import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalRequestError } from "../../../../src/lib/portal/client";
import { demoFailure, json, readTextFields } from "../../../../src/lib/whatsapp-demo/api";

const read = async (response: Response) => ({
  status: response.status,
  body: (await response.json()) as Record<string, unknown>,
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JSON answers", () => {
  it("answers JSON that no cache keeps, with any extra headers", async () => {
    const response = json({ ok: true }, 429, { "Retry-After": "600" });

    expect(response.status).toBe(429);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Retry-After")).toBe("600");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});

describe("demo failures", () => {
  it("asks a new question when the captcha answer was wrong", async () => {
    const error = new PortalRequestError("Portal request failed: no", ["CAPTCHA_FAILED"]);
    expect(await read(demoFailure(error, "code request"))).toEqual({
      status: 400,
      body: {
        error: "captcha",
        message: "That answer was not right. Please try the new question.",
      },
    });
  });

  it("shows the portal's own sentence for something the visitor can fix", async () => {
    const wrongCode = new PortalRequestError("Portal request failed: That code is not right.", [
      "BAD_USER_INPUT",
    ]);
    const limited = new PortalRequestError("Portal request failed: Slow down.", [
      "",
      "TOO_MANY_REQUESTS",
    ]);

    expect(await read(demoFailure(wrongCode, "code check"))).toEqual({
      status: 400,
      body: { error: "refused", message: "That code is not right." },
    });
    expect((await read(demoFailure(limited, "code check"))).body.message).toBe("Slow down.");
  });

  it("logs any other failure and answers a generic 500", async () => {
    const internal = new PortalRequestError("Portal request failed: boom", ["INTERNAL"]);

    expect(await read(demoFailure(internal, "code check"))).toEqual({
      status: 500,
      body: { error: "failed", message: "Something went wrong. Please try again in a minute." },
    });
    expect(console.error).toHaveBeenCalledWith(
      "WhatsApp demo code check failed:",
      "Portal request failed: boom"
    );

    expect((await read(demoFailure(new Error("socket hang up"), "code request"))).status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      "WhatsApp demo code request failed:",
      "socket hang up"
    );
  });

  it("logs a thrown value that is not an Error as unknown", async () => {
    expect((await read(demoFailure("nope", "code check"))).status).toBe(500);
    expect(console.error).toHaveBeenCalledWith("WhatsApp demo code check failed:", "Unknown error");
  });
});

describe("posted text fields", () => {
  it("keeps the named fields, trimmed, and nothing else", () => {
    expect(
      readTextFields({ email: " a@example.com ", code: "123456", extra: "x" }, ["email", "code"])
    ).toEqual({ email: "a@example.com", code: "123456" });
  });

  it("reads anything that is not text as empty", () => {
    expect(readTextFields({ email: 42, code: null }, ["email", "code"])).toEqual({
      email: "",
      code: "",
    });
    expect(readTextFields(null, ["email"])).toEqual({ email: "" });
    expect(readTextFields("email=a", ["email"])).toEqual({ email: "" });
  });
});
