import type * as PdfMakeModule from "pdfmake/build/pdfmake";
import type { PdfBrand, ReportModel } from "@exyconn/gcc-cost";
import { palette } from "../../styles/tokens/palette.tokens";
import { fileStem, saveBlob } from "./download";

type PdfMake = typeof PdfMakeModule;

/** pdfmake needs literal hex colours; these are the palette's hex steps. */
const PDF_COLOURS = {
  ink: palette.ink[900],
  accent: palette.brand[700],
  muted: palette.ink[600],
  rule: palette.brand[400],
} as const;

export function pdfBrand(businessName: string, websiteUrl: string): PdfBrand {
  return { ...PDF_COLOURS, businessName, websiteUrl };
}

/**
 * Renders the report as a PDF in the browser and downloads it. pdfmake and its fonts are about a
 * megabyte, so they load only when a PDF is asked for. Rejects when the PDF cannot be made.
 */
export async function downloadPdf(report: ReportModel, brand: PdfBrand): Promise<void> {
  const [pdfModule, fontsModule, { pdfDocument }] = await Promise.all([
    import("pdfmake/build/pdfmake") as unknown as Promise<{ default: PdfMake }>,
    import("pdfmake/build/vfs_fonts"),
    import("@exyconn/gcc-cost"),
  ]);
  const pdfMake = pdfModule.default;
  pdfMake.addVirtualFileSystem(fontsModule.default);
  const blob = await pdfMake.createPdf(pdfDocument(report, brand)).getBlob();
  saveBlob(blob, `${fileStem(report.title)}.pdf`);
}
