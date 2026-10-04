import { z } from "zod";
import { ONE_TIME_CODE, PHONE } from "@exyconn/regex";
import { captchaAnswer, optionalMatch, requiredEmail } from "../shared/fieldSchemas";

/** Step one: who wants the live demo. Filed as a lead in Website › WhatsApp Leads. */
export const demoLeadSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(120, "Too long!"),
  email: requiredEmail("Work email is required"),
  company: z.string().trim().max(120, "Too long!"),
  phone: optionalMatch(PHONE, "Enter a valid phone number"),
  captcha: captchaAnswer(),
});

/** Step two: the six digits from the "thank you for your live demo" email. */
export const demoCodeSchema = z.object({
  code: z.string().trim().regex(ONE_TIME_CODE, "Enter the six-digit code from the email"),
});

export const DEMO_LEAD_DEFAULTS = { name: "", email: "", company: "", phone: "", captcha: "" };
