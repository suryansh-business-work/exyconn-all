/** submitJobApplication sends one createWebsiteSubmission with the résumé argument. */
import { describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ portalRequest: vi.fn() }));
vi.mock("../../src/lib/portal/client", () => client);

import { submitJobApplication } from "../../src/lib/career/apply";

describe("submitJobApplication", () => {
  it("files a job-application submission with the résumé", async () => {
    client.portalRequest.mockResolvedValue({ createWebsiteSubmission: { id: "s9" } });
    const resume = { name: "cv.pdf", data: "data:application/pdf;base64,JVBERg==" };
    const captcha = { token: "t", answer: "5" };

    expect(await submitJobApplication({ jobId: "JOB-1" }, resume, captcha)).toBe("s9");
    const [query, variables] = client.portalRequest.mock.calls[0];
    expect(query).toContain("resume: $resume");
    expect(variables).toEqual({
      input: { formType: "job-application", source: "website", submissionData: { jobId: "JOB-1" } },
      captcha,
      resume,
    });
  });
});
