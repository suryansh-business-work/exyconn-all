import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { countryOptions, currencyOptions, timezoneOptions, useI18n } from '@exyconn/i18n';
import { RhfAutocomplete, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
} from '@exyconn/shell/graphql/generated';
import { MONTH_OPTIONS } from './months';
import type { OrganizationRow } from './organization.types';

/** A handle is what the company is filed under: lowercase letters, digits and dashes. */
const SLUG = /^[a-z0-9-]*$/;

const schema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  slug: z
    .string()
    .trim()
    .regex(SLUG, 'Use lowercase letters, digits and dashes')
    .max(60, 'Keep the handle under 60 characters'),
  legalName: z.string().trim(),
  country: z.string().trim().length(2, 'Pick the country the company operates in'),
  currency: z.string().trim().length(3, 'Pick the currency it keeps books in'),
  locale: z.string().trim().min(2, 'Pick the language its portal reads in'),
  timezone: z.string().trim().min(1, 'Pick the timezone it works by'),
  // A select hands back its option's value as text; it becomes a number on the way out.
  fiscalYearStartMonth: z.string().regex(/^([1-9]|1[0-2])$/, 'Pick a month'),
  contactEmail: z.string().trim().regex(EMAIL, 'Enter a valid email').or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: OrganizationRow | null): Values => ({
  name: row?.name ?? '',
  slug: row?.slug ?? '',
  legalName: row?.legalName ?? '',
  country: row?.country ?? '',
  currency: row?.currency ?? '',
  locale: row?.locale ?? 'en',
  timezone: row?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  fiscalYearStartMonth: String(row?.fiscalYearStartMonth ?? 1),
  contactEmail: row?.contactEmail ?? '',
});

/** What the server takes: the month as a number, everything else as typed. */
function toInput(values: Values) {
  return { ...values, fiscalYearStartMonth: Number(values.fiscalYearStartMonth) };
}

/** An edit changes everything except the handle, which the company is filed under. */
function toUpdateInput(values: Values) {
  const { name, legalName, country, currency, locale, timezone, contactEmail } = values;
  return {
    name,
    legalName,
    country,
    currency,
    locale,
    timezone,
    contactEmail,
    fiscalYearStartMonth: Number(values.fiscalYearStartMonth),
  };
}

interface OrganizationFormProps {
  initial: OrganizationRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Creates or edits a company on the platform.
 *
 * Every standard it is described in comes from the runtime's own tables — ISO 3166-1
 * countries, ISO 4217 currencies, IANA timezones — so the list is never a table in this
 * repository, and the server checks the same values against the same source.
 */
export function OrganizationForm({ initial, onDone, onCancel }: Readonly<OrganizationFormProps>) {
  const { locale } = useI18n();
  const [createOrganization] = useCreateOrganizationMutation();
  const [updateOrganization] = useUpdateOrganizationMutation();
  const countries = useMemo(() => countryOptions(locale), [locale]);
  const currencies = useMemo(() => currencyOptions(locale), [locale]);
  const zones = useMemo(() => timezoneOptions(initial?.timezone ?? ''), [initial?.timezone]);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Organization',
    initial,
    create: (values: Values) => createOrganization({ variables: { input: toInput(values) } }),
    // The handle is what every record is filed under, so it is set once, at creation.
    update: (row, values) =>
      updateOrganization({ variables: { id: row.id, input: toUpdateInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Company name" />
      <RhfTextField
        name="slug"
        label="Handle"
        disabled={isEdit}
        helperText={isEdit ? 'Set when the company was created' : 'Left blank, made from the name'}
      />
      <RhfTextField name="legalName" label="Legal name" />
      <RhfAutocomplete
        name="country"
        label="Country"
        options={countries.map((option) => ({ value: option.code, label: option.label }))}
      />
      <RhfAutocomplete
        name="currency"
        label="Currency"
        options={currencies.map((option) => ({ value: option.code, label: option.label }))}
        helperText="What this company keeps its books in"
      />
      <RhfTextField name="locale" label="Language" helperText="A BCP 47 tag, such as en or de-DE" />
      <RhfAutocomplete name="timezone" label="Timezone" options={zones} />
      <RhfSelect
        name="fiscalYearStartMonth"
        label="Financial year starts"
        options={MONTH_OPTIONS}
        helperText="January in much of the world, April in India"
      />
      <RhfTextField name="contactEmail" label="Contact email" type="email" />
    </EntityForm>
  );
}
