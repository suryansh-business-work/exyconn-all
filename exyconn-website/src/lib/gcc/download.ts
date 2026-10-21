/** A file name made from an estimate's name: letters, digits and dashes only. */
export function fileStem(name: string): string {
  const stem = name
    .normalize("NFKD")
    // NFKD splits "é" into "e" and a combining accent; drop the accents, keep the letters.
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z\d]+/g, "-")
    // Runs are one dash by now, so at most one comes off each end.
    .replace(/^-/, "")
    .replace(/-$/, "")
    .slice(0, 60);
  return stem || "gcc-estimate";
}

/** Hands a file to the browser's download. Rejects if the browser cannot create it. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function saveText(text: string, fileName: string, type: string): void {
  saveBlob(new Blob([text], { type }), fileName);
}
