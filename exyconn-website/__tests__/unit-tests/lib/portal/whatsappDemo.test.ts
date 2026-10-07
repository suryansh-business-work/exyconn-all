import { beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

import { requestDemoCode, verifyDemoCode } from "../../../../src/lib/portal/whatsappDemo";

const captcha = { token: "question-1", answer: "12" };

beforeEach(() => {
  portalRequest.mockReset();
});

describe("WhatsApp demo sign-in", () => {
  const lead = { name: "Asha", email: "asha@example.com", company: "Acme", phone: "+91 1" };

  it("files the lead from the website with its captcha answer", async () => {
    portalRequest.mockResolvedValue({ requestWhatsappDemoCode: true });

    await expect(requestDemoCode(lead, captcha)).resolves.toBeUndefined();
    expect(portalRequest).toHaveBeenCalledWith(expect.stringContaining("requestWhatsappDemoCode"), {
      input: { ...lead, source: "WEBSITE" },
      captcha,
    });
  });

  it("exchanges the emailed code for the visitor's demo pass", async () => {
    const signIn = {
      token: "demo-pass",
      demoUrl: "https://demo.example.com",
      visitor: { name: "Asha", email: "asha@example.com" },
    };
    portalRequest.mockResolvedValue({ verifyWhatsappDemoCode: signIn });

    await expect(verifyDemoCode("asha@example.com", "123456")).resolves.toEqual(signIn);
    expect(portalRequest).toHaveBeenCalledWith(expect.stringContaining("verifyWhatsappDemoCode"), {
      email: "asha@example.com",
      code: "123456",
    });
  });
});
