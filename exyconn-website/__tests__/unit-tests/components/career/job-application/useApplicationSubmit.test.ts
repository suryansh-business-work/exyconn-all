// @vitest-environment jsdom
/** The job application's captcha loading and send step. */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationSubmit } from "../../../../../src/components/career/job-application/useApplicationSubmit";

const ROLE = { jobId: "job-1", jobTitle: "Engineer", companyName: "Acme", companySlug: "acme" };
const WRONG = "That answer was not right. Please try the new question.";
const LOAD_FAILED = "The security question could not be loaded. Please refresh it.";

let captchaCalls = 0;
const fetchMock = vi.fn();

/** Serves numbered questions from /api/captcha and `post` for the application itself. */
function serve(post: () => Promise<Response> | Response) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url === "/api/captcha") {
      captchaCalls += 1;
      return Response.json({ token: `token-${captchaCalls}`, question: `Q${captchaCalls}` });
    }
    return post();
  });
}

const cv = () => new File(["%PDF-1.7"], "cv.pdf", { type: "application/pdf" });

async function mounted(onRefused = vi.fn()) {
  const view = renderHook(() => useApplicationSubmit(ROLE, onRefused));
  await waitFor(() => expect(view.result.current.captcha.question).toBe("Q1"));
  return view;
}

beforeEach(() => {
  captchaCalls = 0;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the security question", () => {
  it("shows a loading question, then the portal's", async () => {
    serve(() => new Response(null, { status: 200 }));
    const { result } = renderHook(() => useApplicationSubmit(ROLE, vi.fn()));
    expect(result.current.captcha.question).toBe("Loading…");
    await waitFor(() =>
      expect(result.current.captcha).toEqual({ token: "token-1", question: "Q1" })
    );
    expect(result.current.status).toBe("idle");
    expect(fetchMock).toHaveBeenCalledWith("/api/captcha", { cache: "no-store" });
  });

  it("reports a question that failed to load, and a refresh clears it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    serve(() => new Response(null, { status: 200 }));
    const { result } = renderHook(() => useApplicationSubmit(ROLE, vi.fn()));
    await waitFor(() => expect(result.current.captchaError).toBe(LOAD_FAILED));
    expect(log).toHaveBeenCalledWith(
      "The security question could not be loaded",
      expect.any(Error)
    );
    act(() => result.current.refreshCaptcha());
    expect(result.current.captchaError).toBe("");
    await waitFor(() => expect(result.current.captcha.question).toBe("Q1"));
  });

  it("still logs when reporting the load failure itself throws", async () => {
    const thrown = new Error("console broke");
    const log = vi.spyOn(console, "error");
    log.mockImplementation(() => undefined);
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const { result } = renderHook(() => useApplicationSubmit(ROLE, vi.fn()));
    await waitFor(() => expect(log).toHaveBeenCalledWith(thrown));
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    act(() => result.current.refreshCaptcha());
    await waitFor(() => expect(log.mock.calls.filter(([arg]) => arg === thrown)).toHaveLength(2));
  });
});

describe("submit", () => {
  it("posts the role, fields, résumé and captcha, then draws a new question", async () => {
    serve(() => new Response(null, { status: 201 }));
    const { result } = await mounted();
    await act(() => result.current.submit("5", { firstName: "Meera" }, cv()));
    const [url, init] = fetchMock.mock.calls.find(([target]) => target !== "/api/captcha") ?? [];
    expect(url).toBe("/api/job-application");
    expect(init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      formType: "job-application",
      ...ROLE,
      firstName: "Meera",
      resumeName: "cv.pdf",
      captchaToken: "token-1",
      captchaAnswer: "5",
    });
    expect(body.resume.name).toBe("cv.pdf");
    expect(body.resume.data).toMatch(/^data:application\/pdf;base64,/);
    expect(result.current.status).toBe("sent");
    expect(result.current.captcha.question).toBe("Q2");
  });

  it("asks for a new answer when the portal refuses the captcha", async () => {
    serve(() => Response.json({ error: "captcha" }, { status: 400 }));
    const onRefused = vi.fn();
    const { result } = await mounted(onRefused);
    await act(() => result.current.submit("9", {}, cv()));
    expect(result.current.captchaError).toBe(WRONG);
    expect(result.current.status).toBe("idle");
    expect(onRefused).not.toHaveBeenCalled();
    expect(result.current.captcha.token).toBe("token-2");
  });

  it("tells the form when the portal refuses the résumé", async () => {
    serve(() => Response.json({ error: "resume" }, { status: 400 }));
    const onRefused = vi.fn();
    const { result } = await mounted(onRefused);
    await act(() => result.current.submit("5", {}, cv()));
    expect(onRefused).toHaveBeenCalledOnce();
    expect(result.current.captchaError).toBe("");
    expect(result.current.status).toBe("idle");
  });

  it.each([
    ["a server error without JSON", () => new Response("oops", { status: 500 })],
    ["a 400 for another reason", () => Response.json({ error: "email" }, { status: 400 })],
    ["a network failure", () => Promise.reject(new TypeError("offline"))],
  ])("fails on %s", async (_label, post) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    serve(post);
    const { result } = await mounted();
    await act(() => result.current.submit("5", {}, cv()));
    expect(result.current.status).toBe("failed");
    expect(log).toHaveBeenCalledWith("The job application could not be sent", expect.any(Error));
    expect(result.current.captcha.question).toBe("Q2");
  });

  it("fails when the file cannot be read, with or without the reader's error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const readerError = new DOMException("denied");
    let nextError: DOMException | null = readerError;
    class FailingReader {
      error: DOMException | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        this.error = nextError;
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal("FileReader", FailingReader);
    serve(() => new Response(null, { status: 201 }));
    const { result } = await mounted();
    await act(() => result.current.submit("5", {}, cv()));
    expect(log).toHaveBeenCalledWith("The job application could not be sent", readerError);
    nextError = null;
    await act(() => result.current.submit("5", {}, cv()));
    const last = log.mock.calls.at(-1)?.[1] as Error;
    expect(last.message).toBe("The file could not be read");
    expect(result.current.status).toBe("failed");
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/job-application")).toBe(false);
  });
});
