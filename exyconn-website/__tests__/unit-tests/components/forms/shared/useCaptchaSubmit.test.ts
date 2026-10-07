// @vitest-environment jsdom
/** The security question and send step every website form shares. */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SUBMIT_COPY } from "../../../../../src/components/forms/shared/copy";
import { useCaptchaSubmit } from "../../../../../src/components/forms/shared/useCaptchaSubmit";
import { type FakeReply, postedTo, reply, serveSite } from "../forms.helpers";

type Options = Parameters<typeof useCaptchaSubmit>[2];

async function mounted(post: () => FakeReply, onSent = vi.fn(), options: Options = {}) {
  const fetchMock = serveSite(post);
  const view = renderHook(() => useCaptchaSubmit("contact", onSent, options));
  await waitFor(() => expect(view.result.current.captcha.question).toBe("1 + 1 = ?"));
  return { ...view, fetchMock };
}

/** Only the status reset is timed; promises keep resolving on their own. */
const fakeTimeouts = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the security question", () => {
  it("shows the loading text, then the portal's question", async () => {
    serveSite();
    const { result } = renderHook(() => useCaptchaSubmit("contact", vi.fn(), { loading: "Wait" }));
    expect(result.current.captcha).toEqual({ token: "", question: "Wait" });
    await waitFor(() =>
      expect(result.current.captcha).toEqual({ token: "token-1", question: "1 + 1 = ?" })
    );
    expect(result.current.status).toBe("idle");
    expect(result.current.captchaError).toBe("");
  });

  it("reports a question that failed to load, and a refresh clears it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = serveSite();
    fetchMock.mockResolvedValueOnce(reply(500));
    const { result } = renderHook(() => useCaptchaSubmit("contact", vi.fn()));
    await waitFor(() => expect(result.current.captchaError).toBe(SUBMIT_COPY.loadFailed));
    expect(result.current.captcha.question).toBe(SUBMIT_COPY.loading);
    expect(log).toHaveBeenCalledWith(
      "The security question could not be loaded",
      expect.any(Error)
    );
    act(() => result.current.refreshCaptcha());
    expect(result.current.captchaError).toBe("");
    await waitFor(() => expect(result.current.captcha.question).toBe("1 + 1 = ?"));
  });

  it("uses the form's own load-failure text", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    serveSite().mockResolvedValue(reply(500));
    const { result } = renderHook(() =>
      useCaptchaSubmit("contact", vi.fn(), { loadFailed: "Oops" })
    );
    await waitFor(() => expect(result.current.captchaError).toBe("Oops"));
  });

  it("still logs when reporting the load failure itself throws", async () => {
    const thrown = new Error("console broke");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    serveSite().mockResolvedValue(reply(500));
    const { result } = renderHook(() => useCaptchaSubmit("contact", vi.fn()));
    await waitFor(() => expect(log).toHaveBeenCalledWith(thrown));
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    act(() => result.current.refreshCaptcha());
    await waitFor(() => expect(log.mock.calls.filter(([arg]) => arg === thrown)).toHaveLength(2));
  });
});

describe("submit", () => {
  it("sends the fields with the token, reports success, then draws a new question", async () => {
    const onSent = vi.fn();
    const { result, fetchMock } = await mounted(() => reply(200), onSent);
    fakeTimeouts();
    await act(() => result.current.submit("7", { name: "Meera" }));
    expect(postedTo(fetchMock)).toEqual([
      { formType: "contact", name: "Meera", captchaToken: "token-1", captchaAnswer: "7" },
    ]);
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("success");
    expect(result.current.captcha.question).toBe("2 + 1 = ?");
    act(() => vi.advanceTimersByTime(4999));
    expect(result.current.status).toBe("success");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe("idle");
  });

  it("keeps the thank-you up for the form's own time", async () => {
    const { result } = await mounted(() => reply(200), vi.fn(), { successResetMs: 6000 });
    fakeTimeouts();
    await act(() => result.current.submit("7", {}));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.status).toBe("success");
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.status).toBe("idle");
  });

  it("says so when the answer was wrong, and does not count it as sent", async () => {
    const onSent = vi.fn();
    const { result } = await mounted(() => reply(400, { error: "captcha" }), onSent, {
      incorrectAnswer: "Nope",
    });
    await act(() => result.current.submit("1", {}));
    expect(result.current.captchaError).toBe("Nope");
    expect(result.current.status).toBe("idle");
    expect(onSent).not.toHaveBeenCalled();
    expect(result.current.captcha.question).toBe("2 + 1 = ?");
  });

  it("uses the shared wrong-answer text by default", async () => {
    const { result } = await mounted(() => reply(400, { error: "captcha" }));
    await act(() => result.current.submit("1", {}));
    expect(result.current.captchaError).toBe(SUBMIT_COPY.incorrect);
  });

  it("shows the failure banner for five seconds when the send fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onSent = vi.fn();
    const { result } = await mounted(() => reply(500), onSent, { successResetMs: 60_000 });
    fakeTimeouts();
    await act(() => result.current.submit("1", {}));
    expect(result.current.status).toBe("error");
    expect(onSent).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("The contact form could not be sent", expect.any(Error));
    expect(result.current.captcha.question).toBe("2 + 1 = ?");
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.status).toBe("idle");
  });
});
