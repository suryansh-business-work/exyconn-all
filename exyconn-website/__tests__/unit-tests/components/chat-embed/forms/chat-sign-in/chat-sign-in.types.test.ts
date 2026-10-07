/** Who the visitor says they are: the sign-in schema. */
import { describe, expect, it } from "vitest";
import {
  CHAT_SIGN_IN_DEFAULTS,
  chatSignInSchema,
} from "../../../../../../src/components/chat-embed/forms/chat-sign-in";
import { strings } from "../../../../../../src/components/chat-embed/strings";

const VALID = { name: "Riya Sharma", email: "riya@example.com", phone: "" };

function messages(values: Partial<typeof VALID>): string[] {
  const result = chatSignInSchema.safeParse({ ...VALID, ...values });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("chatSignInSchema", () => {
  it("accepts a name and email without a phone, trimming each", () => {
    const parsed = chatSignInSchema.parse({
      name: "  Riya ",
      email: " riya@example.com ",
      phone: "",
    });
    expect(parsed).toEqual({ name: "Riya", email: "riya@example.com", phone: "" });
  });

  it("accepts and trims an optional phone number", () => {
    const parsed = chatSignInSchema.parse({ ...VALID, phone: " +91 98765 43210 " });
    expect(parsed.phone).toBe("+91 98765 43210");
  });

  it("asks for a name", () => {
    expect(messages({ name: "   " })).toContain(strings.nameRequired);
  });

  it("keeps the name within 120 characters", () => {
    expect(messages({ name: "a".repeat(120) })).toEqual([]);
    expect(messages({ name: "a".repeat(121) })).toEqual([strings.nameTooLong]);
  });

  it.each(["riya@example.com", "Riya / Sales", "Riya example.com", "Visit http://spam"])(
    "refuses a name with a link or address: %j",
    (name) => {
      expect(messages({ name })).toEqual([strings.nameLink]);
    }
  );

  it("allows a name with a full stop that is not a domain", () => {
    expect(messages({ name: "Dr. Riya" })).toEqual([]);
  });

  it("asks for an email address", () => {
    expect(messages({ email: "" })).toContain(strings.emailRequired);
  });

  it.each(["riya", "riya@", "riya@example", ".riya@example.com"])(
    "refuses the email %j",
    (email) => {
      expect(messages({ email })).toEqual([strings.emailInvalid]);
    }
  );

  it("refuses an address longer than 254 characters", () => {
    const email = `${"a".repeat(64)}@${"b".repeat(190)}.com`;
    expect(messages({ email })).toContain(strings.emailInvalid);
  });

  it("refuses a phone number that is not one", () => {
    expect(messages({ phone: "call me" })).toEqual([strings.phoneInvalid]);
  });

  it("starts with every field blank", () => {
    expect(CHAT_SIGN_IN_DEFAULTS).toEqual({ name: "", email: "", phone: "" });
  });
});
