import { describe, expect, it } from "vitest";
import { contactChannels, phoneHref } from "../../../../src/lib/india/contact";

const labels = { phoneLabel: "Call us", emailLabel: "Write to us", email: "hello@example.com" };

describe("phone links", () => {
  it("keeps the digits and a leading plus", () => {
    expect(phoneHref("+91 98765 43210")).toBe("tel:+919876543210");
    expect(phoneHref("  (022) 1234-5678 ")).toBe("tel:02212345678");
  });
});

describe("contact channels", () => {
  it("lists the phone line first when branding has a number, then the email", () => {
    expect(contactChannels(" +91 98765 43210 ", labels)).toEqual([
      {
        id: "phone",
        icon: "fa-phone",
        label: "Call us",
        value: "+91 98765 43210",
        href: "tel:+919876543210",
      },
      {
        id: "email",
        icon: "fa-envelope",
        label: "Write to us",
        value: "hello@example.com",
        href: "mailto:hello@example.com",
      },
    ]);
  });

  it("shows no phone line at all when the number is blank", () => {
    const channels = contactChannels("   ", labels);
    expect(channels.map((channel) => channel.id)).toEqual(["email"]);
  });
});
