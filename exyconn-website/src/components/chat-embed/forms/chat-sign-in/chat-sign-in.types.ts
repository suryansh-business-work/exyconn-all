import { z } from "zod";
import { DOMAIN, EMAIL, HTTP_URL, PHONE } from "@exyconn/regex";
import { optionalMatch } from "../../../forms/shared/fieldSchemas";
import { strings } from "../../strings";

/** The server's CHAT_LIMITS.name and the longest address it accepts. */
const MAX_NAME = 120;
const MAX_EMAIL = 254;

/**
 * No link or address in a name: the server prints it in an email to the address given
 * (chat.validation.ts refuses the same). A word that is a URL or a domain counts as a link.
 */
function hasLink(value: string): boolean {
  if (value.includes("@") || value.includes("/")) {
    return true;
  }
  return value.split(" ").some((word) => DOMAIN.test(word) || HTTP_URL.test(word));
}

export const chatSignInSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, strings.nameRequired)
    .max(MAX_NAME, strings.nameTooLong)
    .refine((value) => !hasLink(value), strings.nameLink),
  email: z
    .string()
    .trim()
    .min(1, strings.emailRequired)
    .max(MAX_EMAIL, strings.emailInvalid)
    .regex(EMAIL, strings.emailInvalid),
  phone: optionalMatch(PHONE, strings.phoneInvalid),
});

export type ChatSignInValues = z.infer<typeof chatSignInSchema>;

export const CHAT_SIGN_IN_DEFAULTS: ChatSignInValues = { name: "", email: "", phone: "" };
