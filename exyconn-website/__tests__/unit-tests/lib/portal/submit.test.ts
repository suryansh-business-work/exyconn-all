import { beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

import { getCaptcha, submitForm } from "../../../../src/lib/portal/submit";

const captcha = { token: "question-1", answer: "12" };

beforeEach(() => {
  portalRequest.mockReset();
});

describe("form captcha", () => {
  it("fetches a fresh security question", async () => {
    portalRequest.mockResolvedValue({ websiteCaptcha: { token: "t1", question: "3 + 4?" } });

    await expect(getCaptcha()).resolves.toEqual({ token: "t1", question: "3 + 4?" });
    expect(portalRequest).toHaveBeenCalledWith(expect.stringContaining("websiteCaptcha"));
  });
});

describe("form submission", () => {
  it("files the submission from the website and returns its id", async () => {
    portalRequest.mockResolvedValue({ createWebsiteSubmission: { id: "sub-1" } });

    await expect(submitForm("contact", { email: "a@example.com" }, captcha)).resolves.toBe("sub-1");
    expect(portalRequest).toHaveBeenCalledWith(expect.stringContaining("createWebsiteSubmission"), {
      input: { formType: "contact", source: "website", submissionData: { email: "a@example.com" } },
      captcha,
    });
  });

  it("returns no id when the portal sends none back", async () => {
    portalRequest.mockResolvedValue({ createWebsiteSubmission: null });
    await expect(submitForm("contact", {}, captcha)).resolves.toBeUndefined();
  });
});
