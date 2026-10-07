/** readFormPayload: a posted form taken apart into its type, captcha and fields. */
import { describe, expect, it } from "vitest";
import { readFormPayload } from "../../../src/lib/form-payload";

describe("readFormPayload", () => {
  it("splits the form type, the captcha and the text fields", () => {
    const payload = readFormPayload({
      formType: "contact",
      captchaToken: "tok-1",
      captchaAnswer: "7",
      name: "Meera",
      message: "Hello",
    });
    expect(payload).toEqual({
      formType: "contact",
      captcha: { token: "tok-1", answer: "7" },
      data: { name: "Meera", message: "Hello" },
    });
  });

  it("drops values that are not text", () => {
    const payload = readFormPayload({
      captchaToken: "t",
      captchaAnswer: "1",
      name: "A",
      count: 3,
      nested: { x: 1 },
      flag: true,
      empty: null,
    });
    expect(payload?.data).toEqual({ name: "A" });
  });

  it("gives an empty form type when it is missing or not text", () => {
    expect(readFormPayload({ captchaToken: "t", captchaAnswer: "1" })?.formType).toBe("");
    expect(readFormPayload({ formType: 5, captchaToken: "t", captchaAnswer: "1" })?.formType).toBe(
      ""
    );
  });

  it("refuses a body that is not an object", () => {
    expect(readFormPayload(null)).toBeNull();
    expect(readFormPayload("form")).toBeNull();
    expect(readFormPayload(42)).toBeNull();
    expect(readFormPayload(undefined)).toBeNull();
  });

  it("refuses a post without a captcha token", () => {
    expect(readFormPayload({ formType: "contact", captchaAnswer: "1" })).toBeNull();
    expect(readFormPayload({ captchaToken: "", captchaAnswer: "1" })).toBeNull();
    expect(readFormPayload({ captchaToken: 9, captchaAnswer: "1" })).toBeNull();
  });

  it("refuses a post with a blank captcha answer", () => {
    expect(readFormPayload({ captchaToken: "t" })).toBeNull();
    expect(readFormPayload({ captchaToken: "t", captchaAnswer: "   " })).toBeNull();
  });

  it("keeps the answer as typed once it is not blank", () => {
    expect(readFormPayload({ captchaToken: "t", captchaAnswer: " 4 " })?.captcha).toEqual({
      token: "t",
      answer: " 4 ",
    });
  });
});
