// @vitest-environment jsdom
/** Emailing an estimate: validated, sent with the security answer, success only on confirmation. */
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailDialog } from "../../../../../../src/components/gcc/calculator/dialogs/email";
import { enter, liteEstimate, renderInCalculator } from "../../harness";

const api = vi.hoisted(() => ({ emailEstimate: vi.fn() }));
vi.mock("../../../../../../src/lib/gcc/api", () => api);
const captcha = vi.hoisted(() => ({ fetchCaptcha: vi.fn() }));
vi.mock("../../../../../../src/components/forms/shared/postFormSubmission", () => captcha);

const estimate = liteEstimate();

async function openDialog() {
  const onClose = vi.fn();
  const view = renderInCalculator(<EmailDialog open estimate={estimate} onClose={onClose} />);
  const dialog = screen.getByRole("dialog", { name: "Email this estimate" });
  const answer = await within(dialog).findByRole("textbox", { name: /Security question: 2 \+ 3/ });
  return { ...view, onClose, dialog, answer };
}

async function fill(
  user: Awaited<ReturnType<typeof openDialog>>["user"],
  dialog: HTMLElement,
  answer: HTMLElement
) {
  await enter(user, within(dialog).getByRole("textbox", { name: /Send to/ }), "cfo@example.com");
  await enter(user, within(dialog).getByRole("textbox", { name: /Note to include/ }), "For Monday");
  await user.click(within(dialog).getByRole("checkbox"));
  await enter(user, answer, "5");
}

beforeEach(() => {
  vi.clearAllMocks();
  captcha.fetchCaptcha.mockResolvedValue({ token: "q-1", question: "2 + 3" });
});

describe("EmailDialog", () => {
  it("sends the estimate with the answer, confirms, clears the form and asks a new question", async () => {
    api.emailEstimate.mockResolvedValue({ ok: true, sentTo: "cfo@example.com" });
    const { user, dialog, answer } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send email" }));
    expect(await within(dialog).findByText(/^Sent to cfo@example.com\./)).toBeInTheDocument();
    expect(api.emailEstimate).toHaveBeenCalledWith({
      to: "cfo@example.com",
      estimate,
      note: "For Monday",
      captcha: { token: "q-1", answer: "5" },
    });
    await waitFor(() => expect(captcha.fetchCaptcha).toHaveBeenCalledTimes(2));
    expect(within(dialog).getByRole("textbox", { name: /Send to/ })).toHaveValue("");
  });

  it("shows the server's reason and the alternatives when sending fails", async () => {
    api.emailEstimate.mockResolvedValue({
      ok: false,
      reason: "unavailable",
      message: "Email delivery is unavailable.",
    });
    const { user, dialog, answer } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send email" }));
    expect(
      await within(dialog).findByText(
        "Email delivery is unavailable. Meanwhile you can download the PDF or JSON from Results."
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: /Send to/ })).toHaveValue("cfo@example.com");
  });

  it("says Sending… while the request is out", async () => {
    let finish: (value: unknown) => void = () => undefined;
    api.emailEstimate.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { user, dialog, answer } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send email" }));
    expect(await within(dialog).findByRole("button", { name: "Sending…" })).toBeDisabled();
    finish({ ok: true, sentTo: "cfo@example.com" });
    expect(await within(dialog).findByRole("button", { name: "Send email" })).toBeInTheDocument();
  });

  it("checks every field before sending", async () => {
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole("textbox", { name: /Note to include/ }));
    await user.paste("x".repeat(501));
    await user.click(within(dialog).getByRole("button", { name: "Send email" }));
    expect(await within(dialog).findByText("Enter the address to send it to")).toBeInTheDocument();
    expect(within(dialog).getByText("Use 500 characters or fewer")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Confirm that this estimate may be sent to this address")
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Answer the security question")).toBeInTheDocument();
    expect(api.emailEstimate).not.toHaveBeenCalled();
  });

  it("cannot send until a security question has loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    captcha.fetchCaptcha.mockRejectedValue(new Error("offline"));
    renderInCalculator(<EmailDialog open estimate={estimate} onClose={vi.fn()} />);
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send email" })).toBeDisabled();
  });

  it("closes and forgets the last outcome", async () => {
    api.emailEstimate.mockResolvedValue({ ok: true, sentTo: "cfo@example.com" });
    const { user, dialog, answer, onClose } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send email" }));
    await within(dialog).findByText(/^Sent to/);
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(within(dialog).queryByText(/^Sent to/)).toBeNull();
  });
});
