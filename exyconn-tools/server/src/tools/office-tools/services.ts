import { runCommand } from "../../shared/services/process";

export const OFFICE_EXTENSIONS = new Set([
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
]);

const CONVERT_TIMEOUT_MS = 90_000;

// soffice --headless --convert-to pdf --outdir <dir> <in>
// soffice writes <basename>.pdf into the output directory
export function convertToPdf(
  inputPath: string,
  outputDir: string,
): Promise<void> {
  const soffice = process.env.SOFFICE_PATH || "soffice";
  return runCommand(
    soffice,
    ["--headless", "--convert-to", "pdf", "--outdir", outputDir, inputPath],
    { timeoutMs: CONVERT_TIMEOUT_MS },
  );
}
