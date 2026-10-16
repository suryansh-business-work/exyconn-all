import { z } from 'zod';
import { CRM_PROPERTY_KEY } from '@exyconn/regex';
import {
  CrmPropertyType,
  type CrmObject,
  type CrmPropertyFieldsFragment,
  type CrmPropertyInput,
  type CrmPropertyUpdateInput,
} from '@exyconn/shell/graphql/generated';
import { CHOICE_TYPES } from '../../../../records/schema';

/** A custom property as the settings screen lists and edits it. */
export type CrmPropertyRow = CrmPropertyFieldsFragment;

/** The server's limits, mirrored so a mistake is caught before the round trip. */
const MAX_LABEL = 80;
const MAX_DESCRIPTION = 300;
const MAX_OPTIONS = 100;
const MAX_OPTION_TEXT = 80;

const optionSchema = z.object({
  label: z.string().trim().max(MAX_OPTION_TEXT, 'A choice is at most 80 characters'),
  value: z.string().trim().max(MAX_OPTION_TEXT, 'A value is at most 80 characters'),
  /** A choice that is already saved keeps its value: records store the value, not the label. */
  saved: z.boolean(),
});

type OptionValues = z.infer<typeof optionSchema>;

/** Dropdown rules: 1 to 100 choices, each with a label and a value, no value used twice. */
function checkOptions(options: readonly OptionValues[], ctx: z.RefinementCtx): void {
  if (options.length === 0 || options.length > MAX_OPTIONS) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'Add 1 to 100 choices' });
  }
  const seen = new Set<string>();
  options.forEach((option, index) => {
    if (option.label === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['options', index, 'label'],
        message: 'Name the choice',
      });
    }
    if (option.value === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['options', index, 'value'],
        message: 'Give it a value',
      });
    } else if (seen.has(option.value)) {
      ctx.addIssue({
        code: 'custom',
        path: ['options', index, 'value'],
        message: 'Two choices cannot share a value',
      });
    }
    seen.add(option.value);
  });
}

/** The property form's schema. A key may not be one the record type already has built in. */
export function crmPropertySchema(builtInKeys: ReadonlySet<string>) {
  return z
    .object({
      label: z
        .string()
        .trim()
        .min(1, 'Give the property a label')
        .max(MAX_LABEL, 'A label is at most 80 characters'),
      key: z
        .string()
        .trim()
        .min(1, 'Enter a key')
        .regex(
          CRM_PROPERTY_KEY,
          'Start with a lowercase letter, then use lowercase letters, digits and _ (up to 40)',
        )
        .refine((key) => !builtInKeys.has(key), 'This key is already a built-in property'),
      type: z.enum(CrmPropertyType),
      options: z.array(optionSchema),
      required: z.boolean(),
      description: z.string().trim().max(MAX_DESCRIPTION, 'Help text is at most 300 characters'),
    })
    .superRefine((values, ctx) => {
      if (CHOICE_TYPES.has(values.type)) {
        checkOptions(values.options, ctx);
      }
    });
}

export type CrmPropertyFormValues = z.infer<ReturnType<typeof crmPropertySchema>>;

export const toPropertyFormValues = (row: CrmPropertyRow | null): CrmPropertyFormValues => ({
  label: row?.label ?? '',
  key: row?.key ?? '',
  type: row?.type ?? CrmPropertyType.Text,
  options: (row?.options ?? []).map(({ value, label }) => ({ value, label, saved: true })),
  required: row?.required ?? false,
  description: row?.description ?? '',
});

/** What every save sends: choices only for a choice type, without the form's own bookkeeping. */
export function toPropertyUpdateInput(values: CrmPropertyFormValues): CrmPropertyUpdateInput {
  const options = CHOICE_TYPES.has(values.type)
    ? values.options.map(({ value, label }) => ({ value, label }))
    : [];
  return {
    label: values.label,
    options,
    required: values.required,
    description: values.description,
  };
}

export const toPropertyInput = (
  object: CrmObject,
  values: CrmPropertyFormValues,
): CrmPropertyInput => ({
  ...toPropertyUpdateInput(values),
  object,
  key: values.key,
  type: values.type,
});
