import { z } from 'zod';
import { badRequest } from '../../utils/errors';
import { filterField, OPERATORS_BY_KIND } from './audience.fields';
import {
  COMPANY_EMAIL_SOURCES,
  EMAIL_SELECTIONS,
  RECIPIENT_SOURCES,
  RULE_COMBINATORS,
  RULE_OPERATORS,
  UPDATE_MODES,
  type RuleOperator,
} from './audience.model';
import type { AudienceShape } from './audience.resolve';

/** Enough for any real segment; past this a rule set is a different audience. */
export const MAX_CONDITIONS = 25;
const MAX_NAMED = 5000;
const MAX_EMAIL_TYPES = 20;
const MAX_DAYS = 3650;

const VALUELESS: ReadonlySet<RuleOperator> = new Set(['IS_EMPTY', 'IS_NOT_EMPTY', 'NEVER']);
const DAY_OPERATORS: ReadonlySet<RuleOperator> = new Set(['WITHIN_DAYS', 'OLDER_THAN_DAYS']);

/** What is wrong with one condition, or null. */
function conditionProblem(condition: { field: string; operator: RuleOperator; value: string }) {
  const entry = filterField(condition.field);
  if (!entry) {
    return `"${condition.field}" is not a field an audience can filter on.`;
  }
  if (!OPERATORS_BY_KIND[entry.kind].includes(condition.operator)) {
    return `${entry.label} cannot be compared that way.`;
  }
  if (VALUELESS.has(condition.operator)) {
    return null;
  }
  if (DAY_OPERATORS.has(condition.operator)) {
    const days = Number(condition.value);
    return Number.isInteger(days) && days >= 1 && days <= MAX_DAYS
      ? null
      : `Enter a number of days between 1 and ${MAX_DAYS} for ${entry.label}.`;
  }
  if (!condition.value) {
    return `Enter a value for ${entry.label}.`;
  }
  if (entry.values.length > 0 && !entry.values.includes(condition.value)) {
    return `Choose one of the listed values for ${entry.label}.`;
  }
  return null;
}

const ids = z.array(z.string().trim().min(1)).max(MAX_NAMED);

const audienceFields = z.object({
  description: z.string().trim().max(500).default(''),
  recipientSource: z.enum(RECIPIENT_SOURCES),
  companyEmailSource: z.enum(COMPANY_EMAIL_SOURCES),
  emailSelection: z.enum(EMAIL_SELECTIONS),
  emailTypes: z.array(z.string().trim().min(1)).max(MAX_EMAIL_TYPES).default([]),
  updateMode: z.enum(UPDATE_MODES),
  ruleCombinator: z.enum(RULE_COMBINATORS),
  conditions: z
    .array(
      z.object({
        field: z.string().trim(),
        operator: z.enum(RULE_OPERATORS),
        value: z.string().trim().default(''),
      }),
    )
    .max(MAX_CONDITIONS, `An audience can have at most ${MAX_CONDITIONS} conditions.`)
    .default([]),
  clientIds: ids.default([]),
  contactIds: ids.default([]),
  companyIds: ids.default([]),
  allActiveClients: z.boolean().default(false),
  excludedEmails: z
    .array(z.email('An excluded address is not a valid email.').trim().toLowerCase())
    .max(MAX_NAMED)
    .default([]),
});

type AudienceFields = z.infer<typeof audienceFields>;

/** Rules every resolution needs, a draft's included: conditions that can be run. */
function checkConditions(input: AudienceFields, ctx: z.RefinementCtx) {
  const problem = input.conditions.map(conditionProblem).find(Boolean);
  if (problem) {
    ctx.addIssue({ code: 'custom', message: problem, path: ['conditions'] });
  }
}

/** A form still being filled in: anything that can be resolved, even to nobody. */
export const audienceDraftSchema = audienceFields
  .extend({ name: z.string().trim().default('') })
  .superRefine(checkConditions);

/** An audience being saved: also complete and able to reach somebody. */
export const audienceInputSchema = audienceFields
  .extend({ name: z.string().trim().min(1, 'Name the audience.').max(120) })
  .superRefine((input, ctx) => {
    checkConditions(input, ctx);
    if (input.emailSelection === 'SELECTED_TYPES' && input.emailTypes.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Choose the email types to use.',
        path: ['emailTypes'],
      });
    }
    const named = input.clientIds.length + input.contactIds.length + input.companyIds.length;
    if (input.recipientSource === 'SELECTED_ONLY' && named === 0 && !input.allActiveClients) {
      ctx.addIssue({
        code: 'custom',
        message: 'Pick some records under Data sources, or choose Contacts, Companies or Both.',
        path: ['recipientSource'],
      });
    }
  });

export type AudienceInput = z.infer<typeof audienceInputSchema> & AudienceShape;

/** The input as the schema reads it, or the first rule it breaks as a 400. */
export function parseAudienceInput(
  input: unknown,
  schema: typeof audienceInputSchema | typeof audienceDraftSchema = audienceInputSchema,
): AudienceInput {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    badRequest(parsed.error.issues[0].message);
  }
  return parsed.data;
}
