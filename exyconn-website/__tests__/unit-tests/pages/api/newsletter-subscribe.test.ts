import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ subscribeNewsletter: vi.fn(), getCmsSite: vi.fn() }));
vi.mock("../../../../src/lib/cms", () => ({ getCmsSite: mocks.getCmsSite }));
vi.mock("../../../../src/lib/portal", async () => {
  const { PortalRequestError } = await vi.importActual<
    typeof import("../../../../src/lib/portal/client")
  >("../../../../src/lib/portal/client");
  return { subscribeNewsletter: mocks.subscribeNewsletter, PortalRequestError };
});

import { POST } from "../../../../src/pages/api/newsletter-subscribe";
import { PortalRequestError } from "../../../../src/lib/portal/client";
import { resetVisitorForms } from "../../../../src/lib/visitor-limit";
import { postRequest, readJson, routeContext } from "../route-helpers";

const SIGNUP = { captchaToken: "q-1", captchaAnswer: "5", email: " reader@example.com " };

const post = async (body: unknown, headers: Record<string, string> = {}) =>
  readJson(await POST(routeContext(postRequest("/api/newsletter-subscribe", body, headers))));

beforeEach(() => {
  resetVisitorForms();
  mocks.subscribeNewsletter.mockReset();
  mocks.getCmsSite.mockReset();
  mocks.getCmsSite.mockResolvedValue({ site: { slug: "exyconn" } });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/newsletter-subscribe", () => {
  it("signs the reader up to the site this host serves", async () => {
    mocks.subscribeNewsletter.mockResolvedValue(undefined);

    expect(
      await post({ ...SIGNUP, name: " Reader ", source: "/blog" }, { host: "blog.example.com" })
    ).toEqual({ status: 200, body: { success: true } });
    expect(mocks.getCmsSite).toHaveBeenCalledWith("blog.example.com");
    expect(mocks.subscribeNewsletter).toHaveBeenCalledWith(
      { site: "exyconn", email: "reader@example.com", name: "Reader", source: "/blog" },
      { token: "q-1", answer: "5" }
    );
  });

  it("fills an empty name and source, and reads a request without a host as the default site", async () => {
    await post(SIGNUP);
    expect(mocks.getCmsSite).toHaveBeenCalledWith("");
    expect(mocks.subscribeNewsletter).toHaveBeenCalledWith(
      { site: "exyconn", email: "reader@example.com", name: "", source: "" },
      { token: "q-1", answer: "5" }
    );
  });

  it("asks for the security answer when the post has none", async () => {
    expect(await post({ email: "reader@example.com" })).toEqual({
      status: 400,
      body: { error: "captcha", message: "Please answer the security question." },
    });
  });

  it("refuses an address that is not an email, or a field that is too long", async () => {
    expect(await post({ ...SIGNUP, email: "not-an-email" })).toEqual({
      status: 400,
      body: { error: "invalid", message: "Enter a valid email address." },
    });
    expect((await post({ ...SIGNUP, name: "n".repeat(121) })).body.error).toBe("invalid");
    expect((await post({ captchaToken: "q-1", captchaAnswer: "5" })).body.error).toBe("invalid");
    expect(mocks.subscribeNewsletter).not.toHaveBeenCalled();
  });

  it("says captcha when the portal refuses the answer", async () => {
    mocks.subscribeNewsletter.mockRejectedValue(new PortalRequestError("no", ["CAPTCHA_FAILED"]));
    expect(await post(SIGNUP)).toEqual({
      status: 400,
      body: {
        error: "captcha",
        message: "That answer was not right. Please try the new question.",
      },
    });
  });

  it("logs any other failure and answers 500", async () => {
    mocks.getCmsSite.mockRejectedValueOnce(new Error("cms down"));
    expect(await post(SIGNUP)).toEqual({ status: 500, body: { error: "Failed to sign up" } });
    expect(console.error).toHaveBeenCalledWith("Newsletter sign-up failed:", "cms down");

    mocks.subscribeNewsletter.mockRejectedValueOnce("refused");
    expect((await post(SIGNUP)).status).toBe(500);
    expect(console.error).toHaveBeenCalledWith("Newsletter sign-up failed:", "refused");
  });

  it("stops a visitor after five forms in ten minutes", async () => {
    for (let sent = 0; sent < 5; sent += 1) {
      await post(SIGNUP);
    }
    const response = await POST(routeContext(postRequest("/api/newsletter-subscribe", SIGNUP)));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
  });
});
