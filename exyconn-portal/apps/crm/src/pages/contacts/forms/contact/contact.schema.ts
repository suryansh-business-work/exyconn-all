import { z } from 'zod';
import { ContactStatus, LifecycleStage } from '@exyconn/shell/graphql/generated';
import {
  customDefaults,
  customFieldsSchema,
  toCustomInput,
  type CustomPropertyDef,
} from '../../../../records/custom-fields';
import {
  emailPointSchema,
  emailPointsOf,
  profileDefaults,
  profileSchema,
} from '../../../../records/profile';
import type { ContactRow } from './contact.types';

const baseSchema = profileSchema.extend({
  name: z.string().trim().min(1, 'Name is required'),
  emails: z.array(emailPointSchema).min(1, 'Add at least one email address'),
  title: z.string().trim(),
  department: z.string().trim(),
  companyId: z.string().trim(),
  status: z.enum(ContactStatus),
  lifecycleStage: z.enum(LifecycleStage),
  leadSource: z.string().trim(),
  languages: z.array(z.string().trim().min(1)),
  owner: z.string().trim().min(1, 'Owner is required'),
  notes: z.string().trim(),
});

export const buildContactSchema = (properties: readonly CustomPropertyDef[]) =>
  baseSchema.extend({ custom: customFieldsSchema(properties) });
export type ContactSchema = ReturnType<typeof buildContactSchema>;
export type ContactValues = z.infer<ContactSchema>;

export const toContactValues = (
  row: ContactRow | null,
  properties: readonly CustomPropertyDef[],
): ContactValues => ({
  ...profileDefaults(row),
  name: row?.name ?? '',
  emails: emailPointsOf(row),
  title: row?.title ?? '',
  department: row?.department ?? '',
  companyId: row?.companyId ?? '',
  status: row?.status ?? ContactStatus.Active,
  lifecycleStage: row?.lifecycleStage ?? LifecycleStage.Lead,
  leadSource: row?.leadSource ?? '',
  languages: [...(row?.languages ?? [])],
  owner: row?.owner ?? '',
  notes: row?.notes ?? '',
  custom: customDefaults(properties, row?.custom),
});

/** The company name rides along with its id, so a contact row reads without a join. */
export const toContactInput = (
  values: ContactValues,
  properties: readonly CustomPropertyDef[],
  companyNameOf: (id: string) => string,
) => ({
  ...values,
  companyName: companyNameOf(values.companyId),
  custom: toCustomInput(properties, values.custom),
});
