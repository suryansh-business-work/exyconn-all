// @vitest-environment jsdom
/** The read-only link: consent and an answer first, then the link and its revocation. */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ShareLinkForm,
  shareUrl,
} from "../../../../../../src/components/gcc/calculator/share/ShareLinkForm";
import { enter, liteEstimate, renderInCalculator } from "../../harness";

const api = vi.hoisted(() => ({ createShareLink: vi.fn(), revokeShareLink: vi.fn() }));
vi.mock("../../../../../../src/lib/gcc/api", () => api);
const forms = vi.hoisted(() => ({ fetchCaptcha: vi.fn() }));
vi.mock("../../../../../../src/components/forms/shared/postFormSubmission", () => forms);

const TOKEN = "a".repeat(64);
const KEY = "b".repeat(64);
const estimate = liteEstimate();
const LINK = { ok: true, token: TOKEN, revokeKey: KEY, expiresAt: "2026-10-21T10:00:00.000Z" };

async function renderForm() {
  const view = renderInCalculator(<ShareLinkForm estimate={estimate} active />, { estimate });
  const answer = await screen.findByRole("textbox", { name: /Security question: 2 \+ 3/ });
  return { ...view, answer };
}

async function requestLink(view: Awaited<ReturnType<typeof renderForm>>, days?: string) {
  await view.user.click(screen.getByRole("checkbox"));
  if (days) {
    await view.user.click(screen.getByRole("combobox", { name: "Link expires after" }));
    await view.user.click(await screen.findByRole("option", { name: days }));
  }
  await enter(view.user, view.answer, "5");
  await view.user.click(screen.getByRole("button", { name: "Create link" }));
}

beforeEach(() => {
  globalThis.history.replaceState(null, "", "/en-us/gcc-in-india/cost-calculator");
  forms.fetchCaptcha.mockResolvedValue({ token: "q-1", question: "2 + 3" });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("shareUrl", () => {
  it("puts the token, and the revoke key when given, in the fragment", () => {
    expect(shareUrl("t")).toBe("http://localhost:3000/en-us/gcc-in-india/cost-calculator#share=t");
    expect(shareUrl("t", "k")).toMatch(/#share=t&revoke=k$/);
  });
});

describe("ShareLinkForm", () => {
  it("creates a link for the chosen expiry and shows it with its revocation link", async () => {
    api.createShareLink.mockResolvedValue(LINK);
    const view = await renderForm();
    await requestLink(view, "30 days");
    expect(await screen.findByText(/^Link created\. It works until /)).toBeInTheDocument();
    expect(api.createShareLink).toHaveBeenCalledWith({
      estimate,
      expiresInDays: 30,
      captcha: { token: "q-1", answer: "5" },
    });
    expect(screen.getByRole("textbox", { name: "Shareable link" })).toHaveValue(shareUrl(TOKEN));
    expect(screen.getByRole("textbox", { name: /Revocation link/ })).toHaveValue(
      shareUrl(TOKEN, KEY)
    );
    await waitFor(() => expect(forms.fetchCaptcha).toHaveBeenCalledTimes(2));
  });

  it("offers the expiry choices in days", async () => {
    const view = await renderForm();
    await view.user.click(screen.getByRole("combobox", { name: "Link expires after" }));
    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      "1 day",
      "7 days",
      "30 days",
    ]);
  });

  it("copies the link where the browser allows it", async () => {
    api.createShareLink.mockResolvedValue(LINK);
    const view = await renderForm();
    await requestLink(view);
    // After render: user-event installs its own clipboard when it is set up.
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...globalThis.navigator, clipboard: { writeText } });
    await view.user.click(await screen.findByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(shareUrl(TOKEN));
    vi.stubGlobal("navigator", { ...globalThis.navigator, clipboard: undefined });
    await view.user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("revokes the link, or says why it could not", async () => {
    api.createShareLink.mockResolvedValue(LINK);
    api.revokeShareLink
      .mockResolvedValueOnce({ ok: false, reason: "unavailable", message: "Try later." })
      .mockResolvedValueOnce({ ok: true });
    const view = await renderForm();
    await requestLink(view);
    const revoke = await screen.findByRole("button", { name: "Revoke now" });
    await view.user.click(revoke);
    expect(
      await screen.findByText("The link could not be revoked: Try later.")
    ).toBeInTheDocument();
    await view.user.click(revoke);
    expect(await screen.findByText(/The link is revoked/)).toBeInTheDocument();
    expect(api.revokeShareLink).toHaveBeenLastCalledWith(TOKEN, KEY);
    expect(screen.getByRole("button", { name: "Create link" })).toBeInTheDocument();
  });

  it("falls back to copy and JSON when the server cannot create a link", async () => {
    api.createShareLink.mockResolvedValue({
      ok: false,
      reason: "unavailable",
      message: "Sharing is unavailable.",
    });
    const view = await renderForm();
    await requestLink(view);
    expect(
      await screen.findByText(
        "Sharing is unavailable. You can still copy the summary or send the JSON file instead."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Shareable link" })).toBeNull();
  });

  it("requires consent and an answer", async () => {
    const view = await renderForm();
    await view.user.click(screen.getByRole("button", { name: "Create link" }));
    expect(await screen.findByText("Agree to storage to create a link")).toBeInTheDocument();
    expect(screen.getByText("Answer the security question")).toBeInTheDocument();
    expect(api.createShareLink).not.toHaveBeenCalled();
  });

  it("says Creating link… while the request is out", async () => {
    let finish: (value: unknown) => void = () => undefined;
    api.createShareLink.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const view = await renderForm();
    await requestLink(view);
    expect(await screen.findByRole("button", { name: "Creating link…" })).toBeDisabled();
    finish(LINK);
    expect(await screen.findByText(/^Link created/)).toBeInTheDocument();
  });
});
