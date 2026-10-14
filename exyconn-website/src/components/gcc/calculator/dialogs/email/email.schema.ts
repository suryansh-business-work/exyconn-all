import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../../../../forms/shared/fieldSchemas";

export const emailSchema = z.object({
  to: requiredEmail("Enter the address to send it to", "Enter a valid email address"),
  note: z.string().trim().max(500, "Use 500 characters or fewer"),
  confirm: z.boolean().refine(Boolean, "Confirm that this estimate may be sent to this address"),
  captcha: captchaAnswer("Answer the security question"),
});

export type EmailValues = z.infer<typeof emailSchema>;

export const EMAIL_DEFAULTS: EmailValues = { to: "", note: "", confirm: false, captcha: "" };
