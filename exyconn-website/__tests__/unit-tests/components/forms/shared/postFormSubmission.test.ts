/** The browser side of every website form: loading a question and handing the form over. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchCaptcha,
  postFormSubmission,
} from "../../../../../src/components/forms/shared/postFormSubmission";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const captcha = { token: "tok", answer: "4" };

describe("fetchCaptcha", () => {
  it("loads a fresh, uncached question", async () => {
    fetchMock.mockResolvedValue(Response.json({ token: "t1", question: "2 + 2 = ?" }));
    await expect(fetchCaptcha()).resolves.toEqual({ token: "t1", question: "2 + 2 = ?" });
    expect(fetchMock).toHaveBeenCalledWith("/api/captcha", { cache: "no-store" });
  });

  it("throws with the status when the question cannot be loaded", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(fetchCaptcha()).rejects.toThrow("(503)");
  });
});

describe("postFormSubmission", () => {
  it("posts the form type, fields and captcha to the form inbox", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await expect(postFormSubmission("contact", { name: "Meera" }, captcha)).resolves.toBe("sent");
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/form-submit");
    expect(init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(String(init.body))).toEqual({
      formType: "contact",
      name: "Meera",
      captchaToken: "tok",
      captchaAnswer: "4",
    });
  });

  it("posts to another route when given one", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
    await postFormSubmission("newsletter", {}, captcha, "/api/newsletter");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/newsletter");
  });

  it("resolves captcha when the answer was refused", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "captcha" }, { status: 400 }));
    await expect(postFormSubmission("contact", {}, captcha)).resolves.toBe("captcha");
  });

  it("throws on any other 400", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "invalid" }, { status: 400 }));
    await expect(postFormSubmission("contact", {}, captcha)).rejects.toThrow("status 400");
  });

  it("throws on a failure whose body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));
    await expect(postFormSubmission("contact", {}, captcha)).rejects.toThrow(
      "Form submission failed with status 502"
    );
  });

  it("throws on a captcha error with a status other than 400", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "captcha" }, { status: 429 }));
    await expect(postFormSubmission("contact", {}, captcha)).rejects.toThrow("status 429");
  });
});
