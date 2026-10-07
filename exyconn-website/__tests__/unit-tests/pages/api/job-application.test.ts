import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const submitJobApplication = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/career/apply", () => ({ submitJobApplication }));

import { POST } from "../../../../src/pages/api/job-application";
import { PortalRequestError } from "../../../../src/lib/portal/client";
import { resetVisitorForms } from "../../../../src/lib/visitor-limit";
import { postRequest, readJson, routeContext } from "../route-helpers";

const RESUME = { name: " cv.pdf ", data: "data:application/pdf;base64,JVBERi0xLjQ=" };
const APPLICATION = {
  formType: "job-application",
  captchaToken: "q-1",
  captchaAnswer: "9",
  name: "Asha",
  jobCode: "JOB-1",
  resume: RESUME,
};

const post = async (body: unknown) =>
  readJson(await POST(routeContext(postRequest("/api/job-application", body))));

beforeEach(() => {
  resetVisitorForms();
  submitJobApplication.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/job-application", () => {
  it("files the application with its fields, résumé and captcha answer", async () => {
    submitJobApplication.mockResolvedValue("app-1");

    expect(await post(APPLICATION)).toEqual({ status: 200, body: { success: true } });
    expect(submitJobApplication).toHaveBeenCalledWith(
      { name: "Asha", jobCode: "JOB-1" },
      { name: "cv.pdf", data: RESUME.data },
      { token: "q-1", answer: "9" }
    );
  });

  it("asks for the security answer before anything else", async () => {
    expect(await post({ ...APPLICATION, captchaAnswer: " " })).toEqual({
      status: 400,
      body: { error: "captcha", message: "Please answer the security question." },
    });
  });

  it("asks for a résumé when none, or no readable one, was attached", async () => {
    const unreadable = { name: "cv.pdf", data: "not a data url" };
    for (const body of [
      { ...APPLICATION, resume: undefined },
      { ...APPLICATION, resume: unreadable },
    ]) {
      expect(await post(body)).toEqual({
        status: 400,
        body: { error: "resume", message: "Please attach your résumé." },
      });
    }
    expect(submitJobApplication).not.toHaveBeenCalled();
  });

  it("tells the form which check the portal refused", async () => {
    submitJobApplication.mockRejectedValueOnce(new PortalRequestError("no", ["CAPTCHA_FAILED"]));
    expect(await post(APPLICATION)).toEqual({
      status: 400,
      body: { error: "captcha", message: "That answer was not right." },
    });

    submitJobApplication.mockRejectedValueOnce(
      new PortalRequestError("That file is not a PDF or Word document.", ["BAD_USER_INPUT"])
    );
    expect(await post(APPLICATION)).toEqual({
      status: 400,
      body: { error: "resume", message: "That file is not a PDF or Word document." },
    });
  });

  it("logs any other failure and answers 500", async () => {
    submitJobApplication.mockRejectedValueOnce(new PortalRequestError("boom", ["INTERNAL"]));
    expect(await post(APPLICATION)).toEqual({
      status: 500,
      body: { error: "Failed to submit application" },
    });
    expect(console.error).toHaveBeenCalledWith("Job application failed:", "boom");

    submitJobApplication.mockRejectedValueOnce(42);
    expect((await post(APPLICATION)).status).toBe(500);
    expect(console.error).toHaveBeenCalledWith("Job application failed:", "Unknown error");
  });

  it("answers 500 for a body that is not JSON", async () => {
    expect((await post("{broken")).status).toBe(500);
  });

  it("stops a visitor after five forms in ten minutes", async () => {
    submitJobApplication.mockResolvedValue("app-1");
    for (let sent = 0; sent < 5; sent += 1) {
      await post(APPLICATION);
    }
    const response = await POST(routeContext(postRequest("/api/job-application", APPLICATION)));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
  });
});
