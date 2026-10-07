/** submitJobApplication: one createWebsiteSubmission call carrying the résumé. */
import { afterEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ portalRequest: vi.fn() }));
vi.mock("../../../../src/lib/portal/client", () => client);

import { submitJobApplication } from "../../../../src/lib/career/apply";

const resume = { name: "cv.pdf", data: "data:application/pdf;base64,JVBERg==" };
const captcha = { token: "t-1", answer: "5" };

afterEach(() => client.portalRequest.mockReset());

describe("submitJobApplication", () => {
  it("files the application with its résumé and resolves the submission id", async () => {
    client.portalRequest.mockResolvedValue({ createWebsiteSubmission: { id: "s9" } });
    await expect(submitJobApplication({ jobId: "JOB-1" }, resume, captcha)).resolves.toBe("s9");
    const [query, variables] = client.portalRequest.mock.calls[0] ?? [];
    expect(query).toContain(
      "createWebsiteSubmission(input: $input, captcha: $captcha, resume: $resume)"
    );
    expect(variables).toEqual({
      input: { formType: "job-application", source: "website", submissionData: { jobId: "JOB-1" } },
      captcha,
      resume,
    });
  });

  it("resolves undefined when the portal returns no submission", async () => {
    client.portalRequest.mockResolvedValue({ createWebsiteSubmission: null });
    await expect(submitJobApplication({}, resume, captcha)).resolves.toBeUndefined();
  });

  it("passes the portal's refusal on", async () => {
    client.portalRequest.mockRejectedValue(new Error("CAPTCHA_FAILED"));
    await expect(submitJobApplication({}, resume, captcha)).rejects.toThrow("CAPTCHA_FAILED");
  });
});
