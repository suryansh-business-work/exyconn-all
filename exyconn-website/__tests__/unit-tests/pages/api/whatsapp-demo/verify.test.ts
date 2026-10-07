import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyDemoCode = vi.hoisted(() => vi.fn());
vi.mock("../../../../../src/lib/portal", async () => {
  const { PortalRequestError } = await vi.importActual<
    typeof import("../../../../../src/lib/portal/client")
  >("../../../../../src/lib/portal/client");
  return { verifyDemoCode, PortalRequestError };
});

import { POST } from "../../../../../src/pages/api/whatsapp-demo/verify";
import { PortalRequestError } from "../../../../../src/lib/portal/client";
import { postRequest, readJson, routeContext } from "../../route-helpers";

const post = async (body: unknown) =>
  readJson(await POST(routeContext(postRequest("/api/whatsapp-demo/verify", body))));

beforeEach(() => {
  verifyDemoCode.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/whatsapp-demo/verify", () => {
  it("exchanges the emailed code for the visitor's demo pass", async () => {
    const signIn = {
      token: "demo-pass",
      demoUrl: "https://demo.example.com",
      visitor: { name: "Asha", email: "asha@example.com" },
    };
    verifyDemoCode.mockResolvedValue(signIn);

    expect(await post({ email: " asha@example.com ", code: "123456" })).toEqual({
      status: 200,
      body: signIn,
    });
    expect(verifyDemoCode).toHaveBeenCalledWith("asha@example.com", "123456");
  });

  it("asks for the code when the email or the code is missing", async () => {
    const missing = {
      status: 400,
      body: { error: "refused", message: "Enter the six-digit code from the email." },
    };
    expect(await post({ email: "asha@example.com" })).toEqual(missing);
    expect(await post({ code: "123456" })).toEqual(missing);
    expect(await post("not json")).toEqual(missing);
    expect(verifyDemoCode).not.toHaveBeenCalled();
  });

  it("shows a wrong code as the portal words it", async () => {
    verifyDemoCode.mockRejectedValue(
      new PortalRequestError("Portal request failed: That code is not right.", ["BAD_USER_INPUT"])
    );
    expect(await post({ email: "asha@example.com", code: "000000" })).toEqual({
      status: 400,
      body: { error: "refused", message: "That code is not right." },
    });
  });

  it("logs any other failure as a failed code check", async () => {
    verifyDemoCode.mockRejectedValue(new Error("portal down"));
    expect((await post({ email: "asha@example.com", code: "123456" })).status).toBe(500);
    expect(console.error).toHaveBeenCalledWith("WhatsApp demo code check failed:", "portal down");
  });
});
