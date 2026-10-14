// @vitest-environment jsdom
/**
 * The calculator island end to end in a browser-like DOM: a first visit creates and saves an
 * estimate, every step opens, values survive navigation, invalid input blocks Next with the
 * error beside the field, JSON round-trips, and email/share report only what the server confirmed.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseEstimateFile } from "@exyconn/gcc-cost";
import GccCalculator from "../../../../src/components/gcc/calculator/GccCalculator";
import { readEstimate, readIndex } from "../../../../src/lib/gcc/storage";
import { DEFAULT_PRESET } from "../../lib/gcc/preset-fixture";

const api = vi.hoisted(() => ({
  emailEstimate: vi.fn(),
  createShareLink: vi.fn(),
  readSharedEstimate: vi.fn(),
  revokeShareLink: vi.fn(),
  fetchFxRates: vi.fn(),
}));
vi.mock("../../../../src/lib/gcc/api", () => api);
vi.mock("../../../../src/components/forms/shared/postFormSubmission", () => ({
  fetchCaptcha: vi.fn().mockResolvedValue({ token: "captcha-token", question: "2 + 3" }),
  postFormSubmission: vi.fn().mockResolvedValue("sent"),
}));

const brand = { businessName: "Exyconn", websiteUrl: "https://exyconn.com" };
const saved: { blob: Blob | null; name: string } = { blob: null, name: "" };

beforeEach(() => {
  localStorage.clear();
  globalThis.history.replaceState(null, "", "/en-us/gcc-in-india/cost-calculator");
  globalThis.URL.createObjectURL = vi.fn(() => "blob:test");
  globalThis.URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    saved.name = this.download;
  });
  vi.spyOn(globalThis.URL, "createObjectURL").mockImplementation((blob) => {
    saved.blob = blob as Blob;
    return "blob:test";
  });
});
afterEach(() => vi.clearAllMocks());

const renderCalculator = () => render(<GccCalculator preset={DEFAULT_PRESET} brand={brand} />);
const goToStep = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("GCC calculator", () => {
  it("creates and saves a first estimate in this browser", async () => {
    renderCalculator();
    expect(
      await screen.findByRole("heading", { name: "Company & GCC profile" })
    ).toBeInTheDocument();
    await waitFor(() => expect(readIndex().entries).toHaveLength(1));
    const [entry] = readIndex().entries;
    expect(readEstimate(entry.id).ok).toBe(true);
    expect(screen.getByRole("complementary", { name: "Estimate summary" })).toHaveTextContent(
      "Forecast total"
    );
  });

  it("opens the scenario a ?preset= link names", async () => {
    globalThis.history.replaceState(
      null,
      "",
      "/en-us/gcc-in-india/cost-calculator?preset=enterprise"
    );
    renderCalculator();
    await screen.findByRole("heading", { name: "Company & GCC profile" });
    expect(screen.getByRole("complementary", { name: "Estimate summary" })).toHaveTextContent(
      "Enterprise"
    );
  });

  it("keeps values when moving between steps and autosaves them", async () => {
    renderCalculator();
    const name = await screen.findByRole("textbox", { name: /Company name/ });
    await userEvent.type(name, "Acme Robotics");
    goToStep(/Location & office/);
    expect(await screen.findByRole("heading", { name: "Location & office" })).toBeInTheDocument();
    goToStep(/Company & GCC profile/);
    expect(await screen.findByRole("textbox", { name: /Company name/ })).toHaveValue(
      "Acme Robotics"
    );
    await waitFor(
      () => {
        const read = readEstimate(readIndex().entries[0].id);
        expect(read.ok && read.estimate.company.companyName).toBe("Acme Robotics");
      },
      { timeout: 3000 }
    );
  });

  it("blocks Next on an invalid value and shows the error beside the field", async () => {
    renderCalculator();
    const name = await screen.findByRole("textbox", { name: /Estimate name/ });
    await userEvent.clear(name);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Some fields in this section need attention.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Company & GCC profile" })).toBeInTheDocument();
  });

  it("opens every step without errors", async () => {
    renderCalculator();
    await screen.findByRole("heading", { name: "Company & GCC profile" });
    for (const step of [
      "Location & office",
      "Employees & payroll",
      "AI, tokens & technology",
      "Legal, entity & compliance",
      "HR & recruitment",
      "Admin & operations",
      "Exyconn services & custom items",
      "Forecast & assumptions",
      "Results & sharing",
    ]) {
      goToStep(new RegExp(step.replace(/[&,]/g, ".")));
      expect(await screen.findByRole("heading", { name: step })).toBeInTheDocument();
    }
  });

  it("exports JSON that imports back to the same estimate", async () => {
    renderCalculator();
    await screen.findByRole("heading", { name: "Company & GCC profile" });
    goToStep(/Results & sharing/);
    fireEvent.click(await screen.findByRole("button", { name: "Export estimate (JSON)" }));
    expect(saved.name).toMatch(/\.json$/);
    const parsed = parseEstimateFile(await (saved.blob as Blob).text());
    expect(parsed.ok).toBe(true);
    const stored = readEstimate(readIndex().entries[0].id);
    expect(parsed.ok && stored.ok && parsed.file.estimate.scenarios).toEqual(
      stored.ok && stored.estimate.scenarios
    );
  });

  it("claims an email was sent only when the server confirms it", async () => {
    api.emailEstimate.mockResolvedValueOnce({
      ok: false,
      reason: "unavailable",
      message: "Email delivery is unavailable.",
    });
    renderCalculator();
    await screen.findByRole("heading", { name: "Company & GCC profile" });
    goToStep(/Results & sharing/);
    fireEvent.click(await screen.findByRole("button", { name: "Email this estimate" }));
    const dialog = await screen.findByRole("dialog", { name: "Email this estimate" });
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: /Send to/ }),
      "cfo@example.com"
    );
    fireEvent.click(within(dialog).getByRole("checkbox"));
    await userEvent.type(await within(dialog).findByRole("textbox", { name: /2 \+ 3/ }), "5");
    await act(async () =>
      fireEvent.click(within(dialog).getByRole("button", { name: "Send email" }))
    );
    expect(await within(dialog).findByText(/Email delivery is unavailable/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/^Sent to/)).toBeNull();
    // A failed send keeps what was typed; only a new security answer is needed to retry.
    api.emailEstimate.mockResolvedValueOnce({ ok: true, sentTo: "cfo@example.com" });
    const answer = await within(dialog).findByRole("textbox", { name: /2 \+ 3/ });
    await userEvent.clear(answer);
    await userEvent.type(answer, "5");
    await act(async () =>
      fireEvent.click(within(dialog).getByRole("button", { name: "Send email" }))
    );
    expect(await within(dialog).findByText(/Sent to cfo@example.com/)).toBeInTheDocument();
  });

  it("falls back to copy and JSON when a share link cannot be created", async () => {
    api.createShareLink.mockResolvedValueOnce({
      ok: false,
      reason: "unavailable",
      message: "Sharing is unavailable.",
    });
    renderCalculator();
    await screen.findByRole("heading", { name: "Company & GCC profile" });
    goToStep(/Results & sharing/);
    fireEvent.click(await screen.findByRole("button", { name: "Share or copy" }));
    const dialog = await screen.findByRole("dialog", { name: "Share or copy this estimate" });
    expect(within(dialog).getByRole("button", { name: "Copy summary" })).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Download JSON to send" })
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    await userEvent.type(await within(dialog).findByRole("textbox", { name: /2 \+ 3/ }), "5");
    await act(async () =>
      fireEvent.click(within(dialog).getByRole("button", { name: "Create link" }))
    );
    expect(
      await within(dialog).findByText(/Sharing is unavailable\. You can still copy/)
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("textbox", { name: "Shareable link" })).toBeNull();
  });
});
