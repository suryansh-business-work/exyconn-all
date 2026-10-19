// @vitest-environment jsdom
/** The consultation request: validated, filed through the website inbox, with an optional summary. */
import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsultationDialog } from "../../../../../../src/components/gcc/calculator/dialogs/consultation";
import { enter, liteEstimate, renderInCalculator } from "../../harness";

const forms = vi.hoisted(() => ({ fetchCaptcha: vi.fn(), postFormSubmission: vi.fn() }));
vi.mock("../../../../../../src/components/forms/shared/postFormSubmission", () => forms);

const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

async function openDialog(estimate = liteEstimate()) {
  const onClose = vi.fn();
  const view = renderInCalculator(<ConsultationDialog open onClose={onClose} />, { estimate });
  const dialog = screen.getByRole("dialog", { name: "Request an Exyconn consultation" });
  const answer = await within(dialog).findByRole("textbox", { name: /Security question/ });
  return { ...view, onClose, dialog, answer };
}

type User = Awaited<ReturnType<typeof openDialog>>["user"];

async function fill(user: User, dialog: HTMLElement, answer: HTMLElement) {
  await enter(user, within(dialog).getByRole("textbox", { name: /Your name/ }), "Dana");
  await enter(user, within(dialog).getByRole("textbox", { name: /Work email/ }), "dana@globex.com");
  await enter(user, within(dialog).getByRole("textbox", { name: /Company/ }), "Globex");
  await enter(user, answer, "5");
}

const sent = () => forms.postFormSubmission.mock.calls[0];

beforeEach(() => {
  vi.clearAllMocks();
  forms.fetchCaptcha.mockResolvedValue({ token: "q-1", question: "2 + 3" });
});

describe("ConsultationDialog", () => {
  it("files the request without the summary or marketing by default", async () => {
    forms.postFormSubmission.mockResolvedValue("sent");
    const { user, dialog, answer } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    expect(
      await within(dialog).findByText(/your request has reached our team/)
    ).toBeInTheDocument();
    expect(sent()).toEqual([
      "gcc-consultation",
      {
        name: "Dana",
        email: "dana@globex.com",
        company: "Globex",
        notes: "",
        marketingConsent: "no",
        estimateSummary: "",
      },
      { token: "q-1", answer: "5" },
    ]);
    await waitFor(() => expect(forms.fetchCaptcha).toHaveBeenCalledTimes(2));
    expect(within(dialog).getByRole("textbox", { name: /Your name/ })).toHaveValue("");
  });

  it("adds the estimate's figures and the marketing consent when asked", async () => {
    forms.postFormSubmission.mockResolvedValue("sent");
    const { user, dialog, answer } = await openDialog();
    await settle();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("checkbox", { name: /Include a summary/ }));
    await user.click(within(dialog).getByRole("checkbox", { name: /Exyconn news/ }));
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    await within(dialog).findByText(/your request has reached our team/);
    expect(sent()[1]).toMatchObject({ marketingConsent: "yes" });
    expect(sent()[1].estimateSummary).toContain("Pune GCC");
  });

  it("sends no summary while the estimate has no valid totals", async () => {
    forms.postFormSubmission.mockResolvedValue("sent");
    const { user, dialog, answer } = await openDialog({ ...liteEstimate(), name: "" });
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("checkbox", { name: /Include a summary/ }));
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    await within(dialog).findByText(/your request has reached our team/);
    expect(sent()[1].estimateSummary).toBe("");
  });

  it("asks again after a wrong security answer", async () => {
    forms.postFormSubmission.mockResolvedValue("captcha");
    const { user, dialog, answer } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    expect(
      await within(dialog).findByText("That answer was not right. Here is a new question.")
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/reached our team/)).toBeNull();
  });

  it("says when the request could not be sent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    forms.postFormSubmission.mockRejectedValue(new Error("offline"));
    const { user, dialog, answer, onClose } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    expect(await within(dialog).findByText(/could not be sent right now/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(within(dialog).queryByText(/could not be sent right now/)).toBeNull();
  });

  it("checks every field before sending", async () => {
    const { user, dialog } = await openDialog();
    await enter(user, within(dialog).getByRole("textbox", { name: /Work email/ }), "nope");
    await user.click(within(dialog).getByRole("textbox", { name: /What would you like/ }));
    await user.paste("x".repeat(2001));
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    expect(await within(dialog).findByText("Enter your name")).toBeInTheDocument();
    expect(within(dialog).getByText("Enter a valid email address")).toBeInTheDocument();
    expect(within(dialog).getByText("Enter your company")).toBeInTheDocument();
    expect(within(dialog).getByText("Use 2,000 characters or fewer")).toBeInTheDocument();
    expect(forms.postFormSubmission).not.toHaveBeenCalled();
  });

  it("says Sending… while the request is out", async () => {
    let finish: (value: unknown) => void = () => undefined;
    forms.postFormSubmission.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { user, dialog, answer } = await openDialog();
    await fill(user, dialog, answer);
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    expect(await within(dialog).findByRole("button", { name: "Sending…" })).toBeDisabled();
    finish("sent");
    await within(dialog).findByText(/reached our team/);
  });
});
