// @vitest-environment jsdom
/** The code form: typing the 6 digits, verifying, resending after 30 s, changing the email. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatCodeForm } from "../../../../../../src/components/chat-embed/forms/chat-code";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";

const EMAIL = "riya@example.com";

interface Options {
  codeSentAt?: number;
  busy?: boolean;
}

function mount({ codeSentAt = Date.now() - 60_000, busy = false }: Options = {}) {
  const handlers = { onVerify: vi.fn(), onResend: vi.fn(), onChangeEmail: vi.fn() };
  const view = renderInChatTheme(
    <ChatCodeForm email={EMAIL} codeSentAt={codeSentAt} busy={busy} {...handlers} />
  );
  return { ...view, ...handlers };
}

const codeField = () => screen.getByRole("textbox", { name: new RegExp(strings.code) });

describe("ChatCodeForm", () => {
  it("names the address the code went to and focuses the code field", () => {
    mount();
    expect(screen.getByRole("form", { name: strings.codeTitle })).toBeInTheDocument();
    expect(screen.getByText(strings.codeSentTo(EMAIL))).toBeInTheDocument();
    expect(codeField()).toHaveFocus();
    expect(screen.getByText(strings.codeHint)).toBeInTheDocument();
  });

  it("drops the spaces a pasted code carries and verifies the digits", async () => {
    const { user, onVerify } = mount();
    await user.type(codeField(), "123 456");
    expect(codeField()).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: strings.verify }));
    expect(onVerify).toHaveBeenCalledWith("123456");
  });

  it("refuses a short code and says what is wanted", async () => {
    const { user, onVerify } = mount();
    await user.type(codeField(), "12{Enter}");
    expect(await screen.findByText(strings.codeInvalid)).toBeInTheDocument();
    expect(codeField()).toHaveAttribute("aria-invalid", "true");
    expect(onVerify).not.toHaveBeenCalled();
  });

  it("waits before a code can be resent", () => {
    mount({ codeSentAt: Date.now() });
    const resend = screen.getByRole("button", { name: /Resend code in \d+s/ });
    expect(resend).toBeDisabled();
  });

  it("resends once the wait is over", async () => {
    const { user, onResend } = mount();
    await user.click(screen.getByRole("button", { name: strings.resend }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it("holds both buttons while a request is in flight", () => {
    mount({ busy: true });
    expect(screen.getByRole("button", { name: strings.resend })).toBeDisabled();
    expect(screen.getByRole("button", { name: new RegExp(strings.verify) })).toBeDisabled();
  });

  it("goes back to change the email", async () => {
    const { user, onChangeEmail } = mount();
    await user.click(screen.getByRole("button", { name: strings.changeEmail }));
    expect(onChangeEmail).toHaveBeenCalledTimes(1);
  });
});
