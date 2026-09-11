import { z } from "zod";
import { EMAIL } from "@exyconn/regex";

/** The email every website form asks for; the messages default to the English forms' wording. */
export const requiredEmail = (
  requiredMessage = "Email is required",
  invalidMessage = "Invalid email address"
) => z.string().trim().min(1, requiredMessage).regex(EMAIL, invalidMessage);

/** The answer to the maths captcha; whether it is right is checked on submit. */
export const captchaAnswer = (message = "Please solve the captcha") => z.string().min(1, message);

/** A field that may stay blank, but must match `pattern` once something is typed in it. */
export const optionalMatch = (pattern: RegExp, message: string) =>
  z.union([z.literal(""), z.string().trim().regex(pattern, message)]);
