// @vitest-environment jsdom
/** Every way out of the calculator: files, print, the dialogs, duplicates and new scenarios. */
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExportActions } from "../../../../../../src/components/gcc/calculator/results/ExportActions";
import { liteEstimate, renderInCalculator } from "../../harness";

const files = vi.hoisted(() => ({ saveText: vi.fn(), downloadPdf: vi.fn() }));
vi.mock("../../../../../../src/lib/gcc/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../../src/lib/gcc/download")>()),
  saveText: files.saveText,
}));
vi.mock("../../../../../../src/lib/gcc/pdf", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../../src/lib/gcc/pdf")>()),
  downloadPdf: files.downloadPdf,
}));
vi.mock("../../../../../../src/lib/gcc/api", () => ({
  emailEstimate: vi.fn(),
  createShareLink: vi.fn(),
  revokeShareLink: vi.fn(),
}));
vi.mock("../../../../../../src/components/forms/shared/postFormSubmission", () => ({
  fetchCaptcha: vi.fn().mockResolvedValue({ token: "q", question: "2 + 3" }),
  postFormSubmission: vi.fn(),
}));

const settle = () => new Promise((resolve) => setTimeout(resolve, 200));
const button = (name: string) => screen.getByRole("button", { name });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("ExportActions", () => {
  it("groups the actions as named fieldsets", () => {
    renderInCalculator(<ExportActions />);
    for (const name of ["Download", "Move and share", "Plan"]) {
      expect(screen.getByRole("group", { name }).tagName).toBe("FIELDSET");
    }
  });

  it("downloads CSV and JSON named after the estimate, and confirms each", async () => {
    const { user } = renderInCalculator(<ExportActions />);
    await settle();
    await user.click(button("Export detailed CSV"));
    expect(files.saveText).toHaveBeenLastCalledWith(
      expect.stringContaining(","),
      "pune-gcc.csv",
      "text/csv;charset=utf-8"
    );
    expect(screen.getByRole("status")).toHaveTextContent("CSV downloaded.");
    await user.click(button("Export estimate (JSON)"));
    const [json, name, type] = files.saveText.mock.calls[1];
    expect(JSON.parse(json).estimate.name).toBe("Pune GCC");
    expect([name, type]).toEqual(["pune-gcc.json", "application/json"]);
    expect(screen.getByRole("status")).toHaveTextContent(/^JSON downloaded\./);
    await user.click(within(screen.getByRole("status")).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("makes the PDF with the brand, saying so while it works", async () => {
    let finish: () => void = () => undefined;
    files.downloadPdf.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { user } = renderInCalculator(<ExportActions />);
    await settle();
    await user.click(button("Download PDF report"));
    expect(button("Preparing PDF…")).toBeDisabled();
    expect(files.downloadPdf).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Pune GCC" }),
      expect.objectContaining({ businessName: "Exyconn", websiteUrl: "https://exyconn.com" })
    );
    finish();
    expect(await screen.findByText("PDF downloaded.")).toBeInTheDocument();
    expect(button("Download PDF report")).toBeEnabled();
  });

  it("offers print and CSV when the PDF cannot be made", async () => {
    files.downloadPdf.mockRejectedValue(new Error("no fonts"));
    const { user } = renderInCalculator(<ExportActions />);
    await settle();
    await user.click(button("Download PDF report"));
    expect(await screen.findByText(/The PDF could not be created/)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("prints the report", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    const { user } = renderInCalculator(<ExportActions />);
    await settle();
    await user.click(button("Print report"));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".gcc-print")).toHaveTextContent("Pune GCC");
    vi.unstubAllGlobals();
  });

  it.each([
    ["Import estimate (JSON)", "Import an estimate"],
    ["Share or copy", "Share or copy this estimate"],
    ["Email this estimate", "Email this estimate"],
    ["Request an Exyconn consultation", "Request an Exyconn consultation"],
  ])("opens %j as the %j dialog, and Escape closes it", async (action, name) => {
    const { user } = renderInCalculator(<ExportActions />);
    await settle();
    await user.click(button(action));
    expect(await screen.findByRole("dialog", { name })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("duplicates the estimate", async () => {
    const { user, store } = renderInCalculator(<ExportActions />);
    await settle();
    await user.click(button("Duplicate estimate"));
    expect(store.duplicate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Pune GCC" }),
      "Pune GCC (copy)"
    );
  });

  it("saves the open scenario as a new one and switches to it", async () => {
    const { user, form, estimate } = renderInCalculator(<ExportActions />);
    await user.click(button("Save as new scenario"));
    const scenarios = form.current?.getValues("scenarios") ?? [];
    expect(scenarios).toHaveLength(2);
    expect(scenarios[1].name).toBe(`${estimate.scenarios[0].name} copy`);
    expect(form.current?.getValues("activeScenarioId")).toBe(scenarios[1].id);
  });

  it("saves no scenario past the limit, or when the open one is missing", async () => {
    const base = liteEstimate();
    const six = Array.from({ length: 6 }, (_, i) => ({ ...base.scenarios[0], id: `s${i}` }));
    const full = renderInCalculator(<ExportActions />, {
      estimate: { ...base, scenarios: six, activeScenarioId: "s0" },
    });
    await full.user.click(button("Save as new scenario"));
    expect(full.form.current?.getValues("scenarios")).toHaveLength(6);
    full.unmount();

    const lost = renderInCalculator(<ExportActions />, {
      estimate: { ...base, activeScenarioId: "gone" },
    });
    await lost.user.click(button("Save as new scenario"));
    expect(lost.form.current?.getValues("scenarios")).toHaveLength(1);
  });

  it("disables every export of an invalid estimate and says why", async () => {
    renderInCalculator(<ExportActions />, { estimate: { ...liteEstimate(), name: "" } });
    await settle();
    expect(screen.getByText(/Fix the highlighted fields first/)).toBeInTheDocument();
    for (const name of [
      "Download PDF report",
      "Export detailed CSV",
      "Export estimate (JSON)",
      "Print report",
      "Share or copy",
      "Email this estimate",
      "Duplicate estimate",
    ]) {
      expect(button(name)).toBeDisabled();
    }
    expect(button("Import estimate (JSON)")).toBeEnabled();
    expect(document.querySelector(".gcc-print")).toBeNull();
  });
});
