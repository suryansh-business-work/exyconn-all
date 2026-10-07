// @vitest-environment jsdom
/** The sign-in form: name, email and an optional phone, validated before a code is sent. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatSignInForm } from "../../../../../../src/components/chat-embed/forms/chat-sign-in";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import type { Identity } from "../../../../../../src/components/chat-embed/types";
import { renderInChatTheme } from "../../../../test-utils";

const BLANK: Identity = { name: "", email: "", phone: "" };

function mount(defaultValues: Identity = BLANK, busy = false) {
  const onSubmit = vi.fn();
  const view = renderInChatTheme(
    <ChatSignInForm defaultValues={defaultValues} busy={busy} onSubmit={onSubmit} />
  );
  return { ...view, onSubmit };
}

const field = (label: RegExp) => screen.getByRole("textbox", { name: label });
const nameField = () => field(/^Name/);
const emailField = () => field(/^Email/);
const phoneField = () => field(/^Phone/);
const submitButton = () => screen.getByRole("button", { name: new RegExp(strings.requestCode) });

describe("ChatSignInForm", () => {
  it("explains why it asks and shows a hint under each field", () => {
    mount();
    expect(screen.getByRole("form", { name: strings.signInTitle })).toBeInTheDocument();
    expect(screen.getByText(strings.signInIntro)).toBeInTheDocument();
    expect(screen.getByText(strings.nameHint)).toBeInTheDocument();
    expect(screen.getByText(strings.emailHint)).toBeInTheDocument();
    expect(screen.getByText(strings.phoneHint)).toBeInTheDocument();
    expect(nameField()).toBeRequired();
    expect(phoneField()).not.toBeRequired();
    expect(screen.getByRole("link", { name: strings.privacy })).toHaveAttribute(
      "href",
      "/privacy-policy"
    );
  });

  it("sends the trimmed details", async () => {
    const { user, onSubmit } = mount();
    await user.type(nameField(), "  Riya ");
    await user.type(emailField(), "riya@example.com ");
    await user.type(phoneField(), " +91 98765 43210 ");
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Riya",
      email: "riya@example.com",
      phone: "+91 98765 43210",
    });
  });

  it("starts from the details the visitor gave before", async () => {
    const before = { name: "Riya", email: "riya@example.com", phone: "" };
    const { user, onSubmit } = mount(before);
    expect(nameField()).toHaveValue("Riya");
    expect(emailField()).toHaveValue("riya@example.com");
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith(before);
  });

  it("asks for the required fields on submit", async () => {
    const { user, onSubmit } = mount();
    await user.click(submitButton());
    expect(await screen.findByText(strings.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(strings.emailRequired)).toBeInTheDocument();
    expect(nameField()).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("checks a field as soon as the visitor leaves it", async () => {
    const { user } = mount();
    await user.type(emailField(), "riya@");
    await user.tab();
    expect(await screen.findByText(strings.emailInvalid)).toBeInTheDocument();
    await user.type(phoneField(), "call me");
    await user.tab();
    expect(await screen.findByText(strings.phoneInvalid)).toBeInTheDocument();
  });

  it("refuses a link in the name", async () => {
    const { user, onSubmit } = mount({ ...BLANK, email: "riya@example.com" });
    await user.type(nameField(), "Visit example.com");
    await user.click(submitButton());
    expect(await screen.findByText(strings.nameLink)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("holds the button while the code is being requested", () => {
    mount(BLANK, true);
    expect(submitButton()).toBeDisabled();
  });
});
