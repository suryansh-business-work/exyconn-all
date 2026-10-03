/**
 * The job application's contract, shared by the browser form and the server route: its form
 * type and the résumé rules. No server code here, so the form's bundle can import it.
 */

/** The portal's form type for a job application (its recruiting module files these). */
export const JOB_APPLICATION_FORM_TYPE = "job-application";

/** Decoded size cap — the portal's own limit for a résumé. */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

/** What the file picker offers; the portal checks the bytes, whatever the extension says. */
export const RESUME_ACCEPT = ".pdf,.doc,.docx";

/** The résumé as the browser sends it: its name and a base64 data URL of its bytes. */
export interface ResumeUpload {
  name: string;
  data: string;
}

const DATA_URL = /^data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z\d+/]+=*$/;

/** Encoded length of `bytes` as base64, plus room for the `data:<type>;base64,` header. */
const MAX_DATA_URL_LENGTH = Math.ceil(RESUME_MAX_BYTES / 3) * 4 + 200;

/**
 * The posted résumé when it is a base64 data URL within the size cap, else null. The portal
 * decides whether the bytes really are a PDF or Word file; this only refuses what was not
 * sent by the form, before it is forwarded.
 */
export function readResume(value: unknown): ResumeUpload | null {
  if (typeof value !== "object" || value === null) return null;
  const { name, data } = value as Record<string, unknown>;
  if (typeof name !== "string" || name.trim() === "" || typeof data !== "string") return null;
  if (data.length > MAX_DATA_URL_LENGTH || !DATA_URL.test(data)) return null;
  return { name: name.trim(), data };
}
