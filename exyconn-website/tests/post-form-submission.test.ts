import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCaptcha,
  postFormSubmission,
} from "../src/components/forms/shared/postFormSubmission";

const answer = (status: number, body: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.restoreAllMocks());

describe("the browser side of a form", () => {
  it("loads a question, and fails loudly when it cannot", async () => {
    answer(200, { token: "t", question: "3 + 4" });
    expect(await fetchCaptcha()).toEqual({ token: "t", question: "3 + 4" });
    answer(503, {});
    await expect(fetchCaptcha()).rejects.toThrow("503");
  });

  it("sends the answer with the form and reads the outcome", async () => {
    const sent = answer(200, { success: true });
    expect(
      await postFormSubmission("contact", { email: "a@b.co" }, { token: "t", answer: "7" })
    ).toBe("sent");
    expect(JSON.parse(String(sent.mock.calls[0][1]?.body))).toEqual({
      formType: "contact",
      email: "a@b.co",
      captchaToken: "t",
      captchaAnswer: "7",
    });
    answer(400, { error: "captcha" });
    expect(await postFormSubmission("contact", {}, { token: "t", answer: "1" })).toBe("captcha");
    answer(500, { error: "Failed" });
    await expect(postFormSubmission("contact", {}, { token: "t", answer: "1" })).rejects.toThrow(
      "500"
    );
  });
});
