import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useAudienceFilterCatalogueQuery,
  useCreateAudienceListMutation,
  useUpdateAudienceListMutation,
} from '@exyconn/shell/graphql/generated';
import { BuilderSection } from './BuilderSection';
import { AudienceSourceSection } from './AudienceSourceSection';
import { AudienceEmailSection } from './AudienceEmailSection';
import { AudienceModeSection } from './AudienceModeSection';
import { AudienceRulesSection } from './AudienceRulesSection';
import { AudienceDataSources } from './AudienceDataSources';
import { AudienceLivePreview } from './AudienceLivePreview';
import {
  audienceSchema,
  toFormValues,
  toInput,
  toPreviewInput,
  type AudienceFormValues,
  type AudienceRow,
} from './audience-list.types';

interface AudienceListFormProps {
  initial: AudienceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * The Smart Audience Builder: which CRM registers, which of each record's addresses, whether
 * it follows the CRM, the rules, and the records named by hand — with the server's live
 * counts of who that reaches pinned to the bottom of the screen.
 */
export function AudienceListForm({ initial, onDone, onCancel }: Readonly<AudienceListFormProps>) {
  const { data: catalogue, loading: catalogueLoading } = useAudienceFilterCatalogueQuery();
  const [createAudienceList] = useCreateAudienceListMutation();
  const [updateAudienceList] = useUpdateAudienceListMutation();
  const methods = useForm<AudienceFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(audienceSchema),
    defaultValues: toFormValues(initial),
  });
  const values = useWatch({ control: methods.control }) as AudienceFormValues;

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Audience',
    initial,
    create: (form: AudienceFormValues) =>
      createAudienceList({ variables: { input: toInput(form) } }),
    update: (row, form) => updateAudienceList({ variables: { id: row.id, input: toInput(form) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <BuilderSection title="Audience">
        <RhfTextField
          name="name"
          label="Audience name"
          required
          placeholder="e.g. Delhi café owners — October campaign"
          helperText="Give your audience a unique, recognizable name."
        />
        <RhfTextField
          name="description"
          label="Description"
          multiline
          rows={2}
          helperText="Who this audience contains and why, for your team."
        />
      </BuilderSection>
      <AudienceSourceSection />
      <AudienceEmailSection emailTypes={catalogue?.audienceFilterCatalogue.emailTypes ?? []} />
      <AudienceModeSection snapshotAt={initial?.snapshotAt ?? null} />
      <AudienceRulesSection
        fields={catalogue?.audienceFilterCatalogue.fields ?? []}
        loading={catalogueLoading}
      />
      <AudienceDataSources />
      <AudienceLivePreview input={toPreviewInput(values)} />
    </EntityForm>
  );
}
