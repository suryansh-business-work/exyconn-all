import { z } from "zod";
import { INDIAN_MOBILE } from "@exyconn/regex";
import { captchaAnswer, requiredEmail } from "../shared/fieldSchemas";
import type { IndiaOfferFormValues } from "./india-offer.types";

export const indiaOfferFormSchema = z.object({
  name: z.string().min(1, "नाम ज़रूरी है").min(2, "नाम बहुत छोटा है").max(50, "नाम बहुत लंबा है"),
  phone: z
    .string()
    .trim()
    .min(1, "फ़ोन नंबर ज़रूरी है")
    .regex(INDIAN_MOBILE, "सही 10 अंकों का मोबाइल नंबर डालें"),
  email: requiredEmail("ईमेल ज़रूरी है", "सही ईमेल डालें"),
  business: z.string().max(100, "बहुत लंबा है"),
  plan: z.string().min(1, "कोई प्लान चुनें"),
  message: z.string().max(500, "संदेश बहुत लंबा है"),
  captcha: captchaAnswer("कैप्चा हल करें"),
});

export const INDIA_OFFER_FORM_DEFAULTS: IndiaOfferFormValues = {
  name: "",
  phone: "",
  email: "",
  business: "",
  plan: "",
  message: "",
  captcha: "",
};
