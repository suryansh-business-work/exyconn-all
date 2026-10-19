/** The PDF report: brand colours from the palette, pdfmake loaded on demand, one download. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const pdf = vi.hoisted(() => {
  const getBlob = vi.fn();
  return {
    getBlob,
    addVirtualFileSystem: vi.fn(),
    createPdf: vi.fn(() => ({ getBlob })),
    saveBlob: vi.fn(),
    pdfDocument: vi.fn(() => ({ content: ["doc"] })),
  };
});
vi.mock("pdfmake/build/pdfmake", () => ({
  default: { addVirtualFileSystem: pdf.addVirtualFileSystem, createPdf: pdf.createPdf },
}));
vi.mock("pdfmake/build/vfs_fonts", () => ({ default: { "Roboto.ttf": "AAAA" } }));
vi.mock("@exyconn/gcc-cost", () => ({ pdfDocument: pdf.pdfDocument }));
vi.mock("../../../../src/lib/gcc/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../src/lib/gcc/download")>()),
  saveBlob: pdf.saveBlob,
}));

import type { ReportModel } from "@exyconn/gcc-cost";
import { downloadPdf, pdfBrand } from "../../../../src/lib/gcc/pdf";
import { palette } from "../../../../src/styles/tokens/palette.tokens";

beforeEach(() => vi.clearAllMocks());

describe("pdfBrand", () => {
  it("takes its colours from the palette and the business from branding", () => {
    expect(pdfBrand("Exyconn", "https://exyconn.com")).toEqual({
      ink: palette.ink[900],
      accent: palette.brand[700],
      muted: palette.ink[600],
      rule: palette.brand[400],
      businessName: "Exyconn",
      websiteUrl: "https://exyconn.com",
    });
  });
});

describe("downloadPdf", () => {
  const report = { title: "Pune GCC: FY27" } as ReportModel;
  const brand = pdfBrand("Exyconn", "https://exyconn.com");

  it("renders the report with the fonts and saves it under the estimate's name", async () => {
    const blob = new Blob(["%PDF"]);
    pdf.getBlob.mockResolvedValue(blob);
    await downloadPdf(report, brand);
    expect(pdf.addVirtualFileSystem).toHaveBeenCalledWith({ "Roboto.ttf": "AAAA" });
    expect(pdf.pdfDocument).toHaveBeenCalledWith(report, brand);
    expect(pdf.createPdf).toHaveBeenCalledWith({ content: ["doc"] });
    expect(pdf.saveBlob).toHaveBeenCalledWith(blob, "pune-gcc-fy27.pdf");
  });

  it("rejects, saving nothing, when the PDF cannot be made", async () => {
    pdf.getBlob.mockRejectedValue(new Error("font missing"));
    await expect(downloadPdf(report, brand)).rejects.toThrow("font missing");
    expect(pdf.saveBlob).not.toHaveBeenCalled();
  });
});
