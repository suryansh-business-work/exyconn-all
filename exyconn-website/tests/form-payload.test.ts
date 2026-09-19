import { describe, expect, it } from "vitest";
import { readFormPayload } from "../src/lib/form-payload";

describe("readFormPayload", () => {
  it("splits the form type, the captcha answer and the fields to store", () => {
    expect(
      readFormPayload({
        formType: "contact",
        captchaToken: "t",
        captchaAnswer: "12",
        email: "a@b.co",
        count: 3,
      })
    ).toEqual({
      formType: "contact",
      captcha: { token: "t", answer: "12" },
      data: { email: "a@b.co" },
    });
  });

  it("refuses a post with no captcha, or no answer to it", () => {
    expect(readFormPayload({ formType: "contact", email: "a@b.co" })).toBeNull();
    expect(
      readFormPayload({ formType: "contact", captchaToken: "t", captchaAnswer: "  " })
    ).toBeNull();
    expect(readFormPayload(null)).toBeNull();
    expect(readFormPayload("text")).toBeNull();
  });

  it("reads a missing form type as empty", () => {
    expect(readFormPayload({ captchaToken: "t", captchaAnswer: "1" })?.formType).toBe("");
  });
});
