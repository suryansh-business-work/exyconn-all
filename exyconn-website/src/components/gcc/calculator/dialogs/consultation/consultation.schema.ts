import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../../../../forms/shared/fieldSchemas";

/** Only what is needed to reply; marketing consent is separate, optional and off by default. */
export const consultationSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120, "Use 120 characters or fewer"),
  email: requiredEmail("Enter your work email", "Enter a valid email address"),
  company: z.string().trim().min(1, "Enter your company").max(120, "Use 120 characters or fewer"),
  notes: z.string().trim().max(2000, "Use 2,000 characters or fewer"),
  includeSummary: z.boolean(),
  marketingConsent: z.boolean(),
  captcha: captchaAnswer("Answer the security question"),
});

export type ConsultationValues = z.infer<typeof consultationSchema>;

export const CONSULTATION_DEFAULTS: ConsultationValues = {
  name: "",
  email: "",
  company: "",
  notes: "",
  includeSummary: false,
  marketingConsent: false,
  captcha: "",
};
