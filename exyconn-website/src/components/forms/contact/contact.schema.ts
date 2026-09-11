import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../shared/fieldSchemas";
import type { ContactFormValues } from "./contact.types";

export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "Too short!").max(50, "Too long!"),
  lastName: z.string().min(1, "Last name is required").min(2, "Too short!").max(50, "Too long!"),
  email: requiredEmail(),
  company: z.string().max(100, "Too long!"),
  subject: z.string().min(1, "Please select a subject"),
  message: z
    .string()
    .min(1, "Message is required")
    .min(10, "Message is too short!")
    .max(1000, "Message is too long!"),
  captcha: captchaAnswer(),
});

export const CONTACT_FORM_DEFAULTS: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  subject: "",
  message: "",
  captcha: "",
};
