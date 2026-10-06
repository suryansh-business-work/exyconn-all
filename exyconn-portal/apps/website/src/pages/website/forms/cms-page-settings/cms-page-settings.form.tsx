import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Divider } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateCmsPageMutation,
  useUpdateCmsPageSettingsMutation,
} from '@exyconn/shell/graphql/generated';
import {
  pageSettingsSchema,
  toPageSettingsInput,
  toPageSettingsValues,
  type CmsPageDetail,
  type PageSettingsFormValues,
} from './cms-page-settings.types';
import { PageSeoFields } from './page-seo.fields';

const KIND_OPTIONS = [
  { value: 'PAGE', label: 'Page — one address' },
  { value: 'TEMPLATE', label: 'Template — a family, like /blog/:slug' },
];
const LAYOUT_OPTIONS = [
  { value: 'default', label: 'With the site header and footer' },
  { value: 'bare', label: 'Bare — no header or footer' },
];

interface CmsPageSettingsFormProps {
  siteId: string;
  /** The page being edited; null creates one (path, title, kind and layout only). */
  initial: CmsPageDetail | null;
  onDone: () => void;
  onCancel: () => void;
  /** A new page's id, so the caller can open it in the builder. */
  onCreated?: (id: string) => void;
}

/** React Hook Form + Zod form for a page's address, title, layout and search settings. */
export function CmsPageSettingsForm({
  siteId,
  initial,
  onDone,
  onCancel,
  onCreated,
}: Readonly<CmsPageSettingsFormProps>) {
  const [createPage] = useCreateCmsPageMutation();
  const [updateSettings] = useUpdateCmsPageSettingsMutation();
  const methods = useForm<PageSettingsFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(pageSettingsSchema),
    defaultValues: toPageSettingsValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Page',
    initial,
    create: async (values: PageSettingsFormValues) => {
      const result = await createPage({
        variables: { siteId, input: toPageSettingsInput(values) },
      });
      if (result.data) onCreated?.(result.data.createCmsPage.id);
    },
    update: (row, values) =>
      updateSettings({ variables: { id: row.id, input: toPageSettingsInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="path"
        label="Path"
        helperText="e.g. /about-us, or /blog/:slug for a template"
      />
      <RhfTextField name="title" label="Title" />
      <RhfSelect name="kind" label="Kind" options={KIND_OPTIONS} />
      <RhfSelect name="layout" label="Layout" options={LAYOUT_OPTIONS} />
      {isEdit && <Divider />}
      {isEdit && <PageSeoFields siteId={siteId} />}
    </EntityForm>
  );
}
