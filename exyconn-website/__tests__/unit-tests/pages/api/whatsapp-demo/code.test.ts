import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestDemoCode = vi.hoisted(() => vi.fn());
vi.mock("../../../../../src/lib/portal", async () => {
  const { PortalRequestError } = await vi.importActual<
    typeof import("../../../../../src/lib/portal/client")
  >("../../../../../src/lib/portal/client");
  return { requestDemoCode, PortalRequestError };
});

import { POST } from "../../../../../src/pages/api/whatsapp-demo/code";
import { PortalRequestError } from "../../../../../src/lib/portal/client";
import { resetVisitorForms } from "../../../../../src/lib/visitor-limit";
import { postRequest, readJson, routeContext } from "../../route-helpers";

const LEAD = {
  name: " Asha ",
  email: "asha@example.com",
  company: "Acme",
  phone: "+91 98765 43210",
  captchaToken: "q-1",
  captchaAnswer: " 8 ",
};

const post = async (body: unknown) =>
  readJson(await POST(routeContext(postRequest("/api/whatsapp-demo/code", body))));

beforeEach(() => {
  resetVisitorForms();
  requestDemoCode.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/whatsapp-demo/code", () => {
  it("files the lead, trimmed, with its captcha answer", async () => {
    requestDemoCode.mockResolvedValue(undefined);

    expect(await post(LEAD)).toEqual({ status: 200, body: { success: true } });
    expect(requestDemoCode).toHaveBeenCalledWith(
      { name: "Asha", email: "asha@example.com", company: "Acme", phone: "+91 98765 43210" },
      { token: "q-1", answer: "8" }
    );
  });

  it("asks for the security answer when it is missing or the body is not JSON", async () => {
    const missing = {
      status: 400,
      body: { error: "captcha", message: "Please answer the security question." },
    };
    expect(await post({ ...LEAD, captchaAnswer: "  " })).toEqual(missing);
    expect(await post({ ...LEAD, captchaToken: 7 })).toEqual(missing);
    expect(await post("{broken")).toEqual(missing);
    expect(requestDemoCode).not.toHaveBeenCalled();
  });

  it("passes on the portal's sentence for something the visitor can fix", async () => {
    requestDemoCode.mockRejectedValue(
      new PortalRequestError("Portal request failed: Use a work email.", ["BAD_USER_INPUT"])
    );
    expect(await post(LEAD)).toEqual({
      status: 400,
      body: { error: "refused", message: "Use a work email." },
    });
  });

  it("logs any other failure as a failed code request", async () => {
    requestDemoCode.mockRejectedValue(new Error("smtp down"));
    expect((await post(LEAD)).status).toBe(500);
    expect(console.error).toHaveBeenCalledWith("WhatsApp demo code request failed:", "smtp down");
  });

  it("stops a visitor after five requests in ten minutes", async () => {
    requestDemoCode.mockResolvedValue(undefined);
    for (let sent = 0; sent < 5; sent += 1) {
      await post(LEAD);
    }
    const response = await POST(routeContext(postRequest("/api/whatsapp-demo/code", LEAD)));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
    expect(await response.json()).toEqual({
      error: "refused",
      message: "Too many requests. Please try again later.",
    });
  });
});
