// @vitest-environment jsdom
/** mountCaptcha: brings a server-rendered CaptchaBlock to life. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchCaptcha: vi.fn(), postFormSubmission: vi.fn() }));
vi.mock("../../../src/components/forms/shared/postFormSubmission", () => api);

import { mountCaptcha } from "../../../src/lib/captcha-dom";

const LOAD_FAILED = "The security question could not be loaded. Please try a new one.";
const WRONG_ANSWER = "That answer was not right. Please try the new question.";

function renderBlock(id = "news", parts = ["question", "answer", "refresh", "error"]) {
  const markup: Record<string, string> = {
    question: "<span data-captcha-question></span>",
    answer: "<input data-captcha-answer />",
    refresh: '<button type="button" data-captcha-refresh>New</button>',
    error: '<p data-captcha-error class="hidden"></p>',
  };
  document.body.innerHTML = `<div data-captcha="${id}">${parts.map((p) => markup[p]).join("")}</div>`;
  const q = <T extends Element>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`${selector} is not on the page`);
    return found;
  };
  return {
    question: () => q<HTMLElement>("[data-captcha-question]"),
    input: () => q<HTMLInputElement>("[data-captcha-answer]"),
    refresh: () => q<HTMLButtonElement>("[data-captcha-refresh]"),
    error: () => q<HTMLElement>("[data-captcha-error]"),
  };
}

let served = 0;
beforeEach(() => {
  served = 0;
  api.fetchCaptcha.mockImplementation(async () => {
    served += 1;
    return { token: `tok-${served}`, question: `${served} + 1 = ?` };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  api.fetchCaptcha.mockReset();
  api.postFormSubmission.mockReset();
  document.body.innerHTML = "";
});

describe("mountCaptcha", () => {
  it("returns null when the block or one of its parts is missing", () => {
    renderBlock("other");
    expect(mountCaptcha(document, "news")).toBeNull();
    for (const missing of ["question", "answer", "refresh", "error"]) {
      renderBlock(
        "news",
        ["question", "answer", "refresh", "error"].filter((p) => p !== missing)
      );
      expect(mountCaptcha(document, "news")).toBeNull();
    }
    expect(api.fetchCaptcha).not.toHaveBeenCalled();
  });

  it("shows a loading question, then the portal's", async () => {
    const block = renderBlock();
    mountCaptcha(document, "news");
    expect(block.question().textContent).toBe("Loading…");
    await waitFor(() => expect(block.question().textContent).toBe("1 + 1 = ?"));
  });

  it("reports a question that failed to load", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    api.fetchCaptcha.mockRejectedValueOnce(new Error("down"));
    const block = renderBlock();
    mountCaptcha(document, "news");
    await waitFor(() => expect(block.error().textContent).toBe(LOAD_FAILED));
    expect(block.error().classList.contains("hidden")).toBe(false);
    expect(block.input().getAttribute("aria-invalid")).toBe("true");
    expect(log).toHaveBeenCalledWith(expect.any(Error));
  });

  it("refresh clears the message and draws a new question", async () => {
    const block = renderBlock();
    const captcha = mountCaptcha(document, "news");
    await waitFor(() => expect(block.question().textContent).toBe("1 + 1 = ?"));
    captcha?.setError("Wrong");
    block.input().value = "5";
    block.refresh().click();
    expect(block.error().textContent).toBe("");
    expect(block.error().classList.contains("hidden")).toBe(true);
    expect(block.input().getAttribute("aria-invalid")).toBe("false");
    expect(block.input().value).toBe("");
    await waitFor(() => expect(block.question().textContent).toBe("2 + 1 = ?"));
  });

  it("logs when even reporting a failed load throws", async () => {
    const thrown = new Error("console broke");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    api.fetchCaptcha.mockRejectedValueOnce(new Error("down"));
    const block = renderBlock();
    mountCaptcha(document, "news");
    await waitFor(() => expect(log).toHaveBeenCalledWith(thrown));
    log.mockImplementationOnce(() => {
      throw thrown;
    });
    api.fetchCaptcha.mockRejectedValueOnce(new Error("down again"));
    block.refresh().click();
    await waitFor(() => expect(log.mock.calls.filter(([arg]) => arg === thrown)).toHaveLength(2));
  });

  it("sends the trimmed answer with the current token, then draws a new question", async () => {
    api.postFormSubmission.mockResolvedValue("sent");
    const block = renderBlock();
    const captcha = mountCaptcha(document, "news", "/api/newsletter");
    await waitFor(() => expect(block.question().textContent).toBe("1 + 1 = ?"));
    block.input().value = " 2 ";
    await expect(captcha?.send("newsletter", { email: "a@b.co" })).resolves.toBe("sent");
    expect(api.postFormSubmission).toHaveBeenCalledWith(
      "newsletter",
      { email: "a@b.co" },
      { token: "tok-1", answer: "2" },
      "/api/newsletter"
    );
    expect(block.question().textContent).toBe("2 + 1 = ?");
    expect(block.error().textContent).toBe("");
  });

  it("says so when the answer was wrong", async () => {
    api.postFormSubmission.mockResolvedValue("captcha");
    const block = renderBlock();
    const captcha = mountCaptcha(document, "news");
    await waitFor(() => expect(block.question().textContent).toBe("1 + 1 = ?"));
    await expect(captcha?.send("contact", {})).resolves.toBe("captcha");
    expect(api.postFormSubmission).toHaveBeenCalledWith(
      "contact",
      {},
      { token: "tok-1", answer: "" },
      undefined
    );
    expect(block.error().textContent).toBe(WRONG_ANSWER);
  });

  it("still draws a new question when the send fails", async () => {
    api.postFormSubmission.mockRejectedValue(new Error("HTTP 500"));
    const block = renderBlock();
    const captcha = mountCaptcha(document, "news");
    await waitFor(() => expect(block.question().textContent).toBe("1 + 1 = ?"));
    await expect(captcha?.send("contact", {})).rejects.toThrow("HTTP 500");
    expect(block.question().textContent).toBe("2 + 1 = ?");
  });
});
