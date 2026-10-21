import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import {
  RhfTextField,
  RhfSelect,
  RhfAutocomplete,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  CrmObject,
  LeadSource,
  LeadStage,
  useCampaignOptionsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
} from '@exyconn/shell/graphql/generated';
import {
  CustomFieldsSection,
  CustomPropertiesGate,
  customDefaults,
  customFieldsSchema,
  toCustomInput,
  type CustomPropertyDef,
} from '../../../../records/custom-fields';
import type { LeadRow } from './lead.types';

const baseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
  source: z.enum(LeadSource),
  stage: z.enum(LeadStage),
  value: z.coerce.number({ message: 'Value must be a number' }).min(0, 'Must be ≥ 0'),
  owner: z.string().trim().min(1, 'Owner is required'),
  campaignId: z.string(),
});
const buildSchema = (properties: readonly CustomPropertyDef[]) =>
  baseSchema.extend({ custom: customFieldsSchema(properties) });
type Schema = ReturnType<typeof buildSchema>;
type Values = z.infer<Schema>;

const toInitial = (row: LeadRow | null, properties: readonly CustomPropertyDef[]): Values => ({
  name: row?.name ?? '',
  email: row?.email ?? '',
  source: row?.source ?? LeadSource.Website,
  stage: row?.stage ?? LeadStage.New,
  value: row?.value ?? 0,
  owner: row?.owner ?? '',
  campaignId: row?.campaignId ?? '',
  custom: customDefaults(properties, row?.custom),
});

interface LeadFormProps {
  initial: LeadRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a lead, with the company's own properties. */
export function LeadForm(props: Readonly<LeadFormProps>) {
  return (
    <CustomPropertiesGate object={CrmObject.Lead}>
      {(properties) => <LeadFormFields {...props} properties={properties} />}
    </CustomPropertiesGate>
  );
}

function LeadFormFields({
  initial,
  onDone,
  onCancel,
  properties,
}: Readonly<LeadFormProps & { properties: CustomPropertyDef[] }>) {
  const { data } = useCampaignOptionsQuery();
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const schema = useMemo(() => buildSchema(properties), [properties]);
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, properties),
  });
  const toInput = (values: Values) => ({
    ...values,
    custom: toCustomInput(properties, values.custom),
  });

  const campaignOptions: SelectOption[] = (data?.campaignOptions ?? []).map((campaign) => ({
    value: campaign.id,
    label: campaign.name,
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Lead',
    initial,
    create: (values: Values) => createLead({ variables: { input: toInput(values) } }),
    update: (row, values) => updateLead({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="name"
        label="Name"
        helperText="The person or business this lead is about."
      />
      <RhfTextField
        name="email"
        label="Email"
        type="email"
        helperText="How to reach them; its domain is used to match a company on conversion."
      />
      <RhfSelect
        name="source"
        label="Source"
        options={enumOptions(Object.values(LeadSource))}
        helperText="Where the lead first came from: Website, Referral, Event or Ads."
      />
      <RhfSelect
        name="stage"
        label="Stage"
        options={enumOptions(Object.values(LeadStage))}
        helperText="How far the lead has got; converting it to a deal marks it Won."
      />
      <RhfTextField
        name="value"
        label="Value"
        type="number"
        helperText="What it could be worth if it closes; 0 if not known yet."
      />
      <RhfTextField
        name="owner"
        label="Owner"
        helperText="Who is following up on this lead, e.g. Priya Sharma."
      />
      <RhfAutocomplete
        name="campaignId"
        label="Campaign"
        options={campaignOptions}
        helperText="Optional. Which campaign this lead came from."
      />
      <CustomFieldsSection properties={properties} />
    </EntityForm>
  );
}
