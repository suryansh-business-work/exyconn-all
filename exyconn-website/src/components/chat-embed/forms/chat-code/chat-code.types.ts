import { z } from "zod";
import { ONE_TIME_CODE } from "@exyconn/regex";
import { strings } from "../../strings";

/** The six digits from the "your chat code" email. */
export const chatCodeSchema = z.object({
  code: z.string().trim().regex(ONE_TIME_CODE, strings.codeInvalid),
});

export type ChatCodeValues = z.infer<typeof chatCodeSchema>;

export const CHAT_CODE_DEFAULTS: ChatCodeValues = { code: "" };

/** A new code may be asked for this long after the last one was sent. */
export const RESEND_AFTER_SECONDS = 30;
