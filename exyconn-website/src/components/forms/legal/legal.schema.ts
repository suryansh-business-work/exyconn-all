import { z } from "zod";
import { HTTP_URL } from "@exyconn/regex";
import { captchaAnswer, optionalMatch, requiredEmail } from "../shared/fieldSchemas";
import type { LegalFormValues } from "./legal.types";

export const legalFormSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Too short!").max(100, "Too long!"),
  email: requiredEmail(),
  legalType: z.string().min(1, "Please select a type of legal request"),
  url: optionalMatch(HTTP_URL, "Please enter a valid URL"),
  details: z
    .string()
    .min(1, "Details are required")
    .min(20, "Please provide more details")
    .max(5000, "Details are too long!"),
  captcha: captchaAnswer(),
});

export const LEGAL_FORM_DEFAULTS: LegalFormValues = {
  name: "",
  email: "",
  legalType: "",
  url: "",
  details: "",
  captcha: "",
};
