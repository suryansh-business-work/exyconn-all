import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import {
  AudienceCompanyEmailSource,
  AudienceEmailSelection,
  AudienceRecipientSource,
  AudienceRuleCombinator,
  AudienceRuleOperator,
  AudienceUpdateMode,
  type AudienceListFieldsFragment,
  type AudienceListInput,
} from '@exyconn/shell/graphql/generated';

export type AudienceRow = AudienceListFieldsFragment;

/** Most conditions anyone needs; the server refuses more. */
export const MAX_CONDITIONS = 25;
const MAX_DAYS = 3650;

/** Operators that compare against nothing. */
export const VALUELESS_OPERATORS: ReadonlySet<AudienceRuleOperator> = new Set([
  AudienceRuleOperator.IsEmpty,
  AudienceRuleOperator.IsNotEmpty,
  AudienceRuleOperator.Never,
]);

/** Operators whose value is a number of days. */
export const DAY_OPERATORS: ReadonlySet<AudienceRuleOperator> = new Set([
  AudienceRuleOperator.WithinDays,
  AudienceRuleOperator.OlderThanDays,
]);

const isWholeDays = (value: string): boolean => {
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= MAX_DAYS;
};

/** What is missing from a condition for it to run, or null when it can. */
export function conditionProblem(condition: {
  field: string;
  operator: AudienceRuleOperator;
  value: string;
}) {
  if (!condition.field) {
    return 'Choose a field';
  }
  if (VALUELESS_OPERATORS.has(condition.operator)) {
    return null;
  }
  if (DAY_OPERATORS.has(condition.operator)) {
    return isWholeDays(condition.value) ? null : `Enter a number of days from 1 to ${MAX_DAYS}`;
  }
  return condition.value ? null : 'Enter a value';
}

const conditionSchema = z
  .object({
    /** A stable React key for the row; never sent. */
    key: z.string(),
    field: z.string(),
    operator: z.enum(AudienceRuleOperator),
    value: z.string().trim().max(200, 'Keep the value under 200 characters'),
  })
  .superRefine((condition, ctx) => {
    const problem = conditionProblem(condition);
    if (problem) {
      ctx.addIssue({
        code: 'custom',
        message: problem,
        path: [condition.field ? 'value' : 'field'],
      });
    }
  });

export const audienceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(120, 'Keep the name under 120 characters'),
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    recipientSource: z.enum(AudienceRecipientSource),
    companyEmailSource: z.enum(AudienceCompanyEmailSource),
    emailSelection: z.enum(AudienceEmailSelection),
    emailTypes: z.array(z.string()),
    updateMode: z.enum(AudienceUpdateMode),
    ruleCombinator: z.enum(AudienceRuleCombinator),
    conditions: z
      .array(conditionSchema)
      .max(MAX_CONDITIONS, `Use at most ${MAX_CONDITIONS} conditions`),
    clientIds: z.array(z.string()),
    contactIds: z.array(z.string()),
    companyIds: z.array(z.string()),
    allActiveClients: z.boolean(),
    excludedEmails: z.array(
      z.string().trim().regex(EMAIL, 'Every excluded address must be a valid email'),
    ),
  })
  .refine(
    (values) =>
      values.emailSelection !== AudienceEmailSelection.SelectedTypes ||
      values.emailTypes.length > 0,
    { path: ['emailTypes'], message: 'Choose at least one email type' },
  )
  .refine(
    (values) =>
      values.recipientSource !== AudienceRecipientSource.SelectedOnly ||
      values.allActiveClients ||
      values.clientIds.length + values.contactIds.length + values.companyIds.length > 0,
    { path: ['contactIds'], message: 'Pick some records, or choose Contacts, Companies or Both' },
  );

export type AudienceFormValues = z.infer<typeof audienceSchema>;
export type AudienceConditionValues = AudienceFormValues['conditions'][number];

export const newConditionKey = (): string => globalThis.crypto.randomUUID();

/** The recommended starting point: everyone in the CRM, one preferred address, kept live. */
export function toFormValues(row: AudienceRow | null): AudienceFormValues {
  return {
    name: row?.name ?? '',
    description: row?.description ?? '',
    recipientSource: row?.recipientSource ?? AudienceRecipientSource.Both,
    companyEmailSource: row?.companyEmailSource ?? AudienceCompanyEmailSource.Both,
    emailSelection: row?.emailSelection ?? AudienceEmailSelection.Primary,
    emailTypes: row?.emailTypes ?? [],
    updateMode: row?.updateMode ?? AudienceUpdateMode.Dynamic,
    ruleCombinator: row?.ruleCombinator ?? AudienceRuleCombinator.And,
    conditions: (row?.conditions ?? []).map((condition) => ({
      ...condition,
      key: newConditionKey(),
    })),
    clientIds: row?.clientIds ?? [],
    contactIds: row?.contactIds ?? [],
    companyIds: row?.companyIds ?? [],
    allActiveClients: row?.allActiveClients ?? false,
    excludedEmails: row?.excludedEmails ?? [],
  };
}

/** The values as the API takes them. */
export function toInput(values: AudienceFormValues): AudienceListInput {
  return {
    ...values,
    conditions: values.conditions.map(({ field, operator, value }) => ({ field, operator, value })),
  };
}

/**
 * What the live counts are asked for while somebody is still typing: conditions not yet
 * complete are left out, so the counts follow what is actually decided.
 */
export function toPreviewInput(values: AudienceFormValues): AudienceListInput {
  const ready = values.conditions.filter((condition) => conditionProblem(condition) === null);
  const excluded = values.excludedEmails.filter((email) => EMAIL.test(email.trim()));
  return toInput({ ...values, conditions: ready, excludedEmails: excluded });
}
