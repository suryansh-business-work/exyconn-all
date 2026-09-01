import { runCommand } from "../../shared/services/process";

// qpdf --encrypt <user-password> <owner-password> 256 -- in.pdf out.pdf
export function encryptPdf(
  inputPath: string,
  outputPath: string,
  userPassword: string,
  ownerPassword: string,
): Promise<void> {
  return runCommand("qpdf", [
    "--encrypt",
    userPassword,
    ownerPassword,
    "256",
    "--",
    inputPath,
    outputPath,
  ]);
}

// qpdf --password=<password> --decrypt in.pdf out.pdf
export function decryptPdf(
  inputPath: string,
  outputPath: string,
  password: string,
): Promise<void> {
  return runCommand("qpdf", [
    `--password=${password}`,
    "--decrypt",
    inputPath,
    outputPath,
  ]);
}
