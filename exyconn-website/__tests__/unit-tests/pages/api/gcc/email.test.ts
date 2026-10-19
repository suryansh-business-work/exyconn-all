/** POST /api/gcc/email: checks the address and security answer, then asks the portal to send. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portal = vi.hoisted(() => ({ emailGccEstimate: vi.fn() }));
vi.mock("../../../../../src/lib/portal", async () => {
  const { PortalRequestError } = await vi.importActual<
    typeof import("../../../../../src/lib/portal/client")
  >("../../../../../src/lib/portal/client");
  return { ...portal, PortalRequestError };
});

import { POST } from "../../../../../src/pages/api/gcc/email";
import { PortalRequestError } from "../../../../../src/lib/portal/client";
import { resetGccLimits } from "../../../../../src/lib/gcc/route";
import { postRequest, readJson, routeContext } from "../../route-helpers";

const SEND = {
  to: " cfo@example.com ",
  captchaToken: "q-1",
  captchaAnswer: "5",
  note: " For Monday ",
  estimate: { name: "Pune GCC" },
};

const post = async (body: unknown) =>
  readJson(await POST(routeContext(postRequest("/api/gcc/email", body))));

beforeEach(() => {
  resetGccLimits();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("POST /api/gcc/email", () => {
  it("sends the estimate and says where it went", async () => {
    portal.emailGccEstimate.mockResolvedValue("cfo@example.com");
    expect(await post(SEND)).toEqual({ status: 200, body: { sentTo: "cfo@example.com" } });
    expect(portal.emailGccEstimate).toHaveBeenCalledWith(
      { to: "cfo@example.com", estimateJson: '{"name":"Pune GCC"}', note: "For Monday" },
      { token: "q-1", answer: "5" }
    );
  });

  it("refuses a body it cannot read", async () => {
    expect(await post("[]")).toEqual({
      status: 400,
      body: { error: "invalid", message: "The estimate could not be read." },
    });
  });

  it("asks for a valid address before anything else", async () => {
    expect(await post({ ...SEND, to: "not-an-email" })).toEqual({
      status: 400,
      body: { error: "invalid", message: "Enter a valid email address." },
    });
  });

  it.each([{ captchaToken: "" }, { captchaAnswer: "" }])(
    "asks for the security answer (%o)",
    async (change) => {
      expect(await post({ ...SEND, ...change })).toEqual({
        status: 400,
        body: { error: "captcha", message: "Please answer the security question." },
      });
      expect(portal.emailGccEstimate).not.toHaveBeenCalled();
    }
  );

  it("passes on a wrong security answer as one to retry", async () => {
    portal.emailGccEstimate.mockRejectedValue(
      new PortalRequestError("Portal request failed: wrong", ["CAPTCHA_FAILED"])
    );
    expect(await post(SEND)).toEqual({
      status: 400,
      body: {
        error: "captcha",
        message: "That answer was not right. Please try the new question.",
      },
    });
  });

  it("allows five emails an hour per visitor", async () => {
    portal.emailGccEstimate.mockResolvedValue("cfo@example.com");
    for (let i = 0; i < 5; i += 1) {
      expect((await post(SEND)).status).toBe(200);
    }
    expect((await post(SEND)).status).toBe(429);
    expect(portal.emailGccEstimate).toHaveBeenCalledTimes(5);
  });
});
