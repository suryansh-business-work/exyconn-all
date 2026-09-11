import { z } from "zod";
import { PHONE } from "@exyconn/regex";
import { captchaAnswer, optionalMatch, requiredEmail } from "../shared/fieldSchemas";
import type { CareerFormValues } from "./career.types";

export const careerFormSchema = z.object({
  name: z.string().min(1, "Full name is required").min(2, "Too short!").max(100, "Too long!"),
  email: requiredEmail(),
  phone: optionalMatch(PHONE, "Invalid phone number"),
  jobId: z.string().min(1, "Job ID is required"),
  message: z.string().max(2000, "Message is too long!"),
  captcha: captchaAnswer(),
});

export const CAREER_FORM_DEFAULTS: CareerFormValues = {
  name: "",
  email: "",
  phone: "",
  jobId: "",
  message: "",
  captcha: "",
};

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Why a picked resume is refused — too big or not PDF/DOC/DOCX — or "" when it is fine. */
export function resumeError(file: File): string {
  if (file.size > MAX_RESUME_BYTES) return "File size must be less than 5MB";
  if (!RESUME_TYPES.has(file.type)) return "Only PDF, DOC, and DOCX files are allowed";
  return "";
}
