import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useListCampaignTemplatesQuery,
  useSaveCampaignTemplateMutation,
} from '@exyconn/shell/graphql/generated';
import {
  campaignTemplateSchema,
  EMPTY_TEMPLATE,
  type CampaignTemplateValues,
  type TemplateContent,
} from './campaign-template.types';

interface CampaignTemplateFormProps {
  content: TemplateContent;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Saves the current email design as a reusable template — new, or as the next version of an
 * existing one (whose previous version stays restorable). The campaign keeps its own copy.
 */
export function CampaignTemplateForm({
  content,
  onDone,
  onCancel,
}: Readonly<CampaignTemplateFormProps>) {
  const t = useT();
  const notify = useNotify();
  const { data } = useListCampaignTemplatesQuery();
  const [saveTemplate] = useSaveCampaignTemplateMutation();
  const templates = useMemo(() => data?.listCampaignTemplates ?? [], [data]);
  const methods = useForm<CampaignTemplateValues>({
    mode: 'onTouched',
    resolver: zodResolver(campaignTemplateSchema),
    defaultValues: EMPTY_TEMPLATE,
  });
  const templateId = useWatch({ control: methods.control, name: 'templateId' });

  // Choosing an existing template fills in its name and category, ready to keep or change.
  const { setValue } = methods;
  useEffect(() => {
    const existing = templates.find((template) => template.id === templateId);
    if (existing) {
      setValue('name', existing.name);
      setValue('category', existing.category);
      setValue('description', existing.description);
    }
  }, [templateId, templates, setValue]);

  const submit = async (values: CampaignTemplateValues) => {
    try {
      await saveTemplate({
        variables: {
          id: values.templateId || null,
          input: {
            ...content,
            name: values.name,
            category: values.category,
            description: values.description,
            note: values.note,
          },
        },
      });
      notify(
        values.templateId
          ? 'Template updated — the previous version can be restored'
          : 'Template saved',
        'success',
      );
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'The template could not be saved'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit={Boolean(templateId)}
      onCancel={onCancel}
      submitLabel="Save template"
    >
      <RhfSelect
        name="templateId"
        label="Save as"
        options={[
          { value: '', label: t('A new template') },
          ...templates.map((tpl) => ({
            value: tpl.id,
            label: t('New version of “{name}”', { name: tpl.name }),
          })),
        ]}
        helperText="Updating keeps the old version in the template's history."
      />
      <RhfTextField name="name" label="Template name" required />
      <RhfTextField
        name="category"
        label="Category"
        required
        helperText="e.g. Newsletter, Event, Promotion."
      />
      <RhfTextField name="description" label="Description" multiline rows={2} />
      <RhfTextField
        name="note"
        label="Version note"
        helperText="Optional: what changed in this version."
      />
    </EntityForm>
  );
}
