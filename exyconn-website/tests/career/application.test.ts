/** The job application: the résumé reader, the form schema and the /api/job-application route. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const apply = vi.hoisted(() => ({ submitJobApplication: vi.fn() }));
vi.mock("../../src/lib/career/apply", () => apply);

import {
  JOB_APPLICATION_DEFAULTS,
  jobApplicationSchema,
} from "../../src/components/career/job-application/job-application.schema";
import { readResume, RESUME_MAX_BYTES } from "../../src/lib/career/application";
import { PortalRequestError } from "../../src/lib/portal/client";
import { resetVisitorForms } from "../../src/lib/visitor-limit";
import { POST } from "../../src/pages/api/job-application";

const PDF = `data:application/pdf;base64,${Buffer.from("%PDF-1.7").toString("base64")}`;

describe("readResume", () => {
  it("takes a named base64 data URL", () => {
    expect(readResume({ name: " cv.pdf ", data: PDF })).toEqual({ name: "cv.pdf", data: PDF });
  });

  it("refuses anything the form would not send", () => {
    expect(readResume(null)).toBeNull();
    expect(readResume("cv.pdf")).toBeNull();
    expect(readResume({ name: "", data: PDF })).toBeNull();
    expect(readResume({ name: "cv.pdf", data: 4 })).toBeNull();
    expect(readResume({ name: "cv.pdf", data: "https://x/cv.pdf" })).toBeNull();
    const big = `data:application/pdf;base64,${"A".repeat(Math.ceil(RESUME_MAX_BYTES / 3) * 4 + 400)}`;
    expect(readResume({ name: "cv.pdf", data: big })).toBeNull();
  });
});

describe("jobApplicationSchema", () => {
  const valid = {
    ...JOB_APPLICATION_DEFAULTS,
    firstName: "Meera",
    lastName: "Iyer",
    email: "meera@example.com",
    phone: "+91 98765 43210",
    location: "Pune",
    experience: "4-6",
    noticePeriod: "30days",
    expectedCTC: "24",
    coverLetter: "I have shipped three portals and want to build the next one with you.",
    consent: true,
    captcha: "5",
  };

  it("accepts a complete application", () => {
    expect(jobApplicationSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the fields the form marks required", () => {
    const result = jobApplicationSchema.safeParse(JOB_APPLICATION_DEFAULTS);
    expect(result.success).toBe(false);
    const fields = new Set(result.error?.issues.map((issue) => issue.path[0]));
    [
      "firstName",
      "lastName",
      "email",
      "phone",
      "location",
      "experience",
      "noticePeriod",
      "expectedCTC",
      "coverLetter",
      "consent",
      "captcha",
    ].forEach((field) => expect(fields).toContain(field));
    ["currentCTC", "linkedin", "portfolio", "referral"].forEach((field) =>
      expect(fields).not.toContain(field)
    );
  });

  it("checks formats and choices", () => {
    const bad = {
      ...valid,
      expectedCTC: "lots",
      currentCTC: "1.234",
      linkedin: "linkedin.com/in/x",
      experience: "100",
      referral: "billboard",
    };
    const fields = jobApplicationSchema.safeParse(bad).error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(
      expect.arrayContaining(["expectedCTC", "currentCTC", "linkedin", "experience", "referral"])
    );
  });
});

const post = async (body: unknown) => {
  const request = new Request("https://exyconn.com/api/job-application", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.9" },
    body: JSON.stringify(body),
  });
  const response = await POST({ request } as Parameters<typeof POST>[0]);
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
};

const FORM = {
  formType: "job-application",
  captchaToken: "tok",
  captchaAnswer: "5",
  jobId: "JOB-001",
  email: "meera@example.com",
  resumeName: "cv.pdf",
  resume: { name: "cv.pdf", data: PDF },
};

describe("POST /api/job-application", () => {
  beforeEach(() => {
    resetVisitorForms();
    apply.submitJobApplication.mockReset();
  });

  it("sends the fields, the résumé and the captcha answer to the portal", async () => {
    apply.submitJobApplication.mockResolvedValue("s1");
    expect(await post(FORM)).toEqual({ status: 200, body: { success: true } });
    expect(apply.submitJobApplication).toHaveBeenCalledWith(
      { jobId: "JOB-001", email: "meera@example.com", resumeName: "cv.pdf" },
      { name: "cv.pdf", data: PDF },
      { token: "tok", answer: "5" }
    );
  });

  it("asks for the captcha, then the résumé, before calling the portal", async () => {
    expect((await post({ ...FORM, captchaAnswer: "" })).body.error).toBe("captcha");
    expect((await post({ ...FORM, resume: undefined })).body.error).toBe("resume");
    expect(apply.submitJobApplication).not.toHaveBeenCalled();
  });

  it("says which check the portal refused", async () => {
    apply.submitJobApplication.mockRejectedValueOnce(
      new PortalRequestError("wrong", ["CAPTCHA_FAILED"])
    );
    expect(await post(FORM)).toMatchObject({ status: 400, body: { error: "captcha" } });
    apply.submitJobApplication.mockRejectedValueOnce(
      new PortalRequestError("This type of file cannot be uploaded here.", ["BAD_USER_INPUT"])
    );
    expect(await post(FORM)).toMatchObject({ status: 400, body: { error: "resume" } });
  });

  it("reports any other failure as a 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    apply.submitJobApplication.mockRejectedValueOnce(new Error("portal down"));
    expect((await post(FORM)).status).toBe(500);
    apply.submitJobApplication.mockRejectedValueOnce("odd");
    expect((await post(FORM)).status).toBe(500);
  });

  it("limits how many forms one visitor sends", async () => {
    apply.submitJobApplication.mockResolvedValue("s1");
    const statuses = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await post(FORM)).status);
    expect(statuses.at(-1)).toBe(429);
  });
});
