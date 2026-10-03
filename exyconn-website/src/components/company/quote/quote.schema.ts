import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../../forms/shared/fieldSchemas";
import {
  DEFAULT_QUOTE_INPUT,
  DURATION_PRESETS,
  HOURS_OPTIONS,
  PROJECT_TYPES,
  QUOTE_LIMITS,
  ROLES,
} from "../../../lib/company/quote";
import type { QuoteFormValues } from "./quote.types";

const idsOf = (list: readonly { id: string }[]) =>
  list.map((item) => item.id) as [string, ...string[]];

const NUMBER = { error: "Enter a number" };

const teamLineSchema = z.object({
  roleId: z.enum(idsOf(ROLES)),
  count: z
    .number(NUMBER)
    .int("Whole people only")
    .min(QUOTE_LIMITS.minCount, `At least ${QUOTE_LIMITS.minCount}`)
    .max(QUOTE_LIMITS.maxCount, `At most ${QUOTE_LIMITS.maxCount}`),
  rate: z
    .number(NUMBER)
    .min(QUOTE_LIMITS.minRate, `At least $${QUOTE_LIMITS.minRate}/hr`)
    .max(QUOTE_LIMITS.maxRate, `At most $${QUOTE_LIMITS.maxRate}/hr`),
  customLabel: z.string().trim().max(60, "Too long!"),
});

const personName = (label: string) =>
  z.string().trim().min(1, `${label} is required`).min(2, "Too short!").max(50, "Too long!");

/** Every field of the quote, with the same limits the old calculator clamped to. */
export const quoteFormSchema = z.object({
  projectTypeId: z.enum(idsOf(PROJECT_TYPES)),
  description: z.string().trim().max(1000, "Too long!"),
  team: z
    .array(teamLineSchema)
    .min(1, "Add at least one role")
    .max(QUOTE_LIMITS.maxTeam, `At most ${QUOTE_LIMITS.maxTeam} roles`),
  durationId: z.enum(idsOf(DURATION_PRESETS)),
  customMonths: z
    .number(NUMBER)
    .min(QUOTE_LIMITS.minMonths, `At least ${QUOTE_LIMITS.minMonths} months`)
    .max(QUOTE_LIMITS.maxMonths, `At most ${QUOTE_LIMITS.maxMonths} months`),
  hoursId: z.enum(idsOf(HOURS_OPTIONS)),
  firstName: personName("First name"),
  lastName: personName("Last name"),
  email: requiredEmail(),
  company: z.string().trim().max(100, "Too long!"),
  notes: z.string().trim().max(1000, "Too long!"),
  captcha: captchaAnswer(),
});

/** The fields each step checks before the visitor may move on. */
export const STEP_FIELDS: readonly (readonly (keyof QuoteFormValues)[])[] = [
  ["projectTypeId", "description"],
  ["team", "durationId", "customMonths", "hoursId"],
  ["firstName", "lastName", "email", "company", "notes"],
  ["captcha"],
];

export const QUOTE_FORM_DEFAULTS: QuoteFormValues = {
  ...DEFAULT_QUOTE_INPUT,
  team: DEFAULT_QUOTE_INPUT.team.map((line) => ({ ...line })),
  description: "",
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  notes: "",
  captcha: "",
};
