import { z } from "zod";
import { HTTP_URL, PHONE } from "@exyconn/regex";
import { APPLY_COPY } from "../../../lib/career/copy";
import { captchaAnswer, optionalMatch, requiredEmail } from "../../forms/shared/fieldSchemas";
import type { JobApplicationValues } from "./job-application.types";

/** Lakhs per annum, e.g. "12" or "12.5". */
const LPA = /^\d{1,3}(?:\.\d{1,2})?$/;

const oneOf = (options: readonly { value: string }[], message: string) => {
  const allowed = new Set(options.map((option) => option.value));
  return z.string().refine((value) => allowed.has(value), message);
};

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .min(2, `${label} is too short`)
    .max(50, `${label} is too long`);

/**
 * The job application (React Hook Form + Zod). The résumé is checked apart from this schema —
 * a File is not form text — and the captcha's answer is only checked by the portal.
 */
export const jobApplicationSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  email: requiredEmail(),
  phone: z.string().trim().min(1, "Phone number is required").regex(PHONE, "Invalid phone number"),
  location: z.string().trim().min(1, "Location is required").max(100, "Location is too long"),
  experience: oneOf(APPLY_COPY.experienceOptions, "Select your experience"),
  noticePeriod: oneOf(APPLY_COPY.noticeOptions, "Select your notice period"),
  currentCTC: optionalMatch(LPA, "Enter a number, e.g. 12 or 12.5"),
  expectedCTC: z
    .string()
    .trim()
    .min(1, "Expected CTC is required")
    .regex(LPA, "Enter a number, e.g. 12 or 12.5"),
  linkedin: optionalMatch(HTTP_URL, "Enter a full link starting with https://"),
  portfolio: optionalMatch(HTTP_URL, "Enter a full link starting with https://"),
  coverLetter: z
    .string()
    .trim()
    .min(1, "Tell us why you want to join")
    .min(20, "A little more, please — at least 20 characters")
    .max(2000, "Keep it under 2000 characters"),
  referral: z.union([z.literal(""), oneOf(APPLY_COPY.referralOptions, "Select an option")]),
  consent: z.boolean().refine((value) => value, "Please agree to continue"),
  captcha: captchaAnswer(),
});

export const JOB_APPLICATION_DEFAULTS: JobApplicationValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  experience: "",
  noticePeriod: "",
  currentCTC: "",
  expectedCTC: "",
  linkedin: "",
  portfolio: "",
  coverLetter: "",
  referral: "",
  consent: false,
  captcha: "",
};
