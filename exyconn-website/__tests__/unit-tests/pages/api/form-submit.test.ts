import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portal = vi.hoisted(() => ({ submitForm: vi.fn(), getWebsiteFormTypes: vi.fn() }));
vi.mock("../../../../src/lib/portal", async () => {
  const { PortalRequestError } = await vi.importActual<
    typeof import("../../../../src/lib/portal/client")
  >("../../../../src/lib/portal/client");
  return { ...portal, PortalRequestError };
});

import { POST } from "../../../../src/pages/api/form-submit";
import { PortalRequestError } from "../../../../src/lib/portal/client";
import { resetVisitorForms } from "../../../../src/lib/visitor-limit";
import { postRequest, readJson, routeContext } from "../route-helpers";

const FORM = { formType: "contact", captchaToken: "q-1", captchaAnswer: "7", email: "a@b.co" };

const post = async (body: unknown) =>
  readJson(await POST(routeContext(postRequest("/api/form-submit", body))));

beforeEach(() => {
  resetVisitorForms();
  portal.submitForm.mockReset();
  portal.getWebsiteFormTypes.mockReset();
  portal.getWebsiteFormTypes.mockResolvedValue(new Set(["contact"]));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/form-submit", () => {
  it("stores the form's fields and hands the captcha answer to the portal", async () => {
    portal.submitForm.mockResolvedValue("sub-1");

    expect(await post(FORM)).toEqual({ status: 200, body: { success: true } });
    expect(portal.submitForm).toHaveBeenCalledWith(
      "contact",
      { email: "a@b.co" },
      { token: "q-1", answer: "7" }
    );
  });

  it("asks for the security answer when the post has none", async () => {
    expect(await post({ formType: "contact", email: "a@b.co" })).toEqual({
      status: 400,
      body: { error: "captcha", message: "Please answer the security question." },
    });
    expect(portal.getWebsiteFormTypes).not.toHaveBeenCalled();
  });

  it("refuses a missing form type or one the portal does not accept", async () => {
    for (const formType of ["", "made-up"]) {
      expect(await post({ ...FORM, formType })).toEqual({
        status: 400,
        body: { error: "Invalid form type" },
      });
    }
    expect(portal.submitForm).not.toHaveBeenCalled();
  });

  it("says captcha when the portal refuses the answer", async () => {
    portal.submitForm.mockRejectedValue(new PortalRequestError("no", ["CAPTCHA_FAILED"]));
    expect((await post(FORM)).body).toEqual({
      error: "captcha",
      message: "That answer was not right. Please try the new question.",
    });
  });

  it("logs any other refusal or failure, naming the form, and answers 500", async () => {
    portal.submitForm.mockRejectedValueOnce(new PortalRequestError("bad", ["BAD_USER_INPUT"]));
    expect(await post(FORM)).toEqual({ status: 500, body: { error: "Failed to submit form" } });
    expect(console.error).toHaveBeenCalledWith("Form submission failed (contact):", "bad");

    portal.submitForm.mockRejectedValueOnce("not an error");
    expect((await post(FORM)).status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      "Form submission failed (contact):",
      "Unknown error"
    );
  });

  it("answers 500 for a body that is not JSON", async () => {
    expect(await post("{not json")).toEqual({
      status: 500,
      body: { error: "Failed to submit form" },
    });
    expect(console.error).toHaveBeenCalledWith("Form submission failed ():", expect.any(String));
  });

  it("stops a visitor after five forms in ten minutes", async () => {
    portal.submitForm.mockResolvedValue("sub-1");
    for (let sent = 0; sent < 5; sent += 1) {
      expect((await post(FORM)).status).toBe(200);
    }

    const response = await POST(routeContext(postRequest("/api/form-submit", FORM)));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
    expect(await response.json()).toEqual({
      error: "Too many submissions. Please try again later.",
    });
  });
});
