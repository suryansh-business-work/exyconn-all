import { beforeEach, describe, expect, it, vi } from "vitest";

const portal = vi.hoisted(() => ({
  submitForm: vi.fn(),
  getWebsiteFormTypes: vi.fn(),
}));

vi.mock("../src/lib/portal", async () => {
  const { PortalRequestError } = await vi.importActual<typeof import("../src/lib/portal/client")>(
    "../src/lib/portal/client"
  );
  return { ...portal, PortalRequestError };
});

import { POST } from "../src/pages/api/form-submit";
import { PortalRequestError } from "../src/lib/portal/client";
import { resetVisitorForms } from "../src/lib/visitor-limit";

const post = async (body: unknown) => {
  const request = new Request("https://exyconn.com/api/form-submit", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.5" },
    body: JSON.stringify(body),
  });
  const response = await POST({ request } as Parameters<typeof POST>[0]);
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

const FORM = { formType: "contact", captchaToken: "tok", captchaAnswer: "7", email: "a@b.co" };

describe("POST /api/form-submit", () => {
  beforeEach(() => {
    resetVisitorForms();
    portal.submitForm.mockReset();
    portal.getWebsiteFormTypes.mockResolvedValue(new Set(["contact"]));
  });

  it("stores the fields and passes the captcha answer to the portal", async () => {
    portal.submitForm.mockResolvedValue("s1");
    expect(await post(FORM)).toEqual({ status: 200, body: { success: true } });
    expect(portal.submitForm).toHaveBeenCalledWith(
      "contact",
      { email: "a@b.co" },
      { token: "tok", answer: "7" }
    );
  });

  it("asks for the security answer when there is none", async () => {
    const { status, body } = await post({ formType: "contact", email: "a@b.co" });
    expect(status).toBe(400);
    expect(body.error).toBe("captcha");
    expect(portal.submitForm).not.toHaveBeenCalled();
  });

  it("says captcha when the portal refuses the answer", async () => {
    portal.submitForm.mockRejectedValue(new PortalRequestError("wrong", ["CAPTCHA_FAILED"]));
    const { status, body } = await post(FORM);
    expect(status).toBe(400);
    expect(body.error).toBe("captcha");
  });

  it("refuses a form type the portal does not accept", async () => {
    expect((await post({ ...FORM, formType: "made-up" })).status).toBe(400);
  });

  it("reports any other failure as a 500", async () => {
    portal.submitForm.mockRejectedValue(new Error("portal down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await post(FORM)).status).toBe(500);
  });
});
