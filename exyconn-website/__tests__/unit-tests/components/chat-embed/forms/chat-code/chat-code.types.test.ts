/** The 6-digit chat code's schema. */
import { describe, expect, it } from "vitest";
import {
  CHAT_CODE_DEFAULTS,
  chatCodeSchema,
  RESEND_AFTER_SECONDS,
} from "../../../../../../src/components/chat-embed/forms/chat-code";
import { strings } from "../../../../../../src/components/chat-embed/strings";

function messages(code: string): string[] {
  const result = chatCodeSchema.safeParse({ code });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("chatCodeSchema", () => {
  it("accepts six digits and trims the spaces around them", () => {
    expect(chatCodeSchema.parse({ code: " 123456 " })).toEqual({ code: "123456" });
  });

  it.each(["", "12345", "1234567", "12345a", "12 456"])("refuses %j", (code) => {
    expect(messages(code)).toEqual([strings.codeInvalid]);
  });

  it("starts blank and allows a resend after 30 seconds", () => {
    expect(CHAT_CODE_DEFAULTS).toEqual({ code: "" });
    expect(RESEND_AFTER_SECONDS).toBe(30);
  });
});
