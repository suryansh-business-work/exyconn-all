import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../shared/fieldSchemas";
import type { GrievanceFormValues } from "./grievance.types";

export const grievanceFormSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Too short!").max(100, "Too long!"),
  email: requiredEmail(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .min(5, "Subject is too short!")
    .max(200, "Subject is too long!"),
  message: z
    .string()
    .min(1, "Grievance details are required")
    .min(20, "Please provide more details about your grievance")
    .max(3000, "Message is too long!"),
  captcha: captchaAnswer(),
});

export const GRIEVANCE_FORM_DEFAULTS: GrievanceFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  captcha: "",
};
