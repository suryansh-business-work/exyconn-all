import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Divider } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateCmsSiteMutation,
  useUpdateCmsSiteMutation,
} from '@exyconn/shell/graphql/generated';
import {
  cmsSiteSchema,
  toSiteFormValues,
  toSiteInput,
  type CmsSiteFormValues,
  type CmsSiteRow,
} from './cms-site.types';
import { SiteIdentityFields } from './site-identity.fields';
import { SiteSeoFields } from './site-seo.fields';
import { SiteStructureFields } from './site-structure.fields';
import { SiteCodeFields } from './site-code.fields';

interface CmsSiteFormProps {
  initial: CmsSiteRow | null;
  onDone: () => void;
  onCancel: () => void;
  /** Called with the saved site — its key may have changed, and with it the portal address. */
  onSaved?: (site: CmsSiteRow) => void;
}

/**
 * React Hook Form + Zod form for a website: identity and domains, search defaults, the
 * fragments and design system it wears, and code added to every page. The server checks
 * the same rules (unique key and domains) and its message is shown when it refuses.
 */
export function CmsSiteForm({ initial, onDone, onCancel, onSaved }: Readonly<CmsSiteFormProps>) {
  const [createSite] = useCreateCmsSiteMutation({ refetchQueries: ['CmsSites'] });
  const [updateSite] = useUpdateCmsSiteMutation({ refetchQueries: ['CmsSites'] });
  const methods = useForm<CmsSiteFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(cmsSiteSchema),
    defaultValues: toSiteFormValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Website',
    initial,
    create: (values: CmsSiteFormValues) =>
      createSite({ variables: { input: toSiteInput(values) } }),
    update: async (row, values) => {
      const result = await updateSite({ variables: { id: row.id, input: toSiteInput(values) } });
      if (result.data) onSaved?.(result.data.updateCmsSite);
    },
    onDone,
  });

  const siteId = initial?.id;
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <SiteIdentityFields siteId={siteId} />
      <Divider />
      <SiteSeoFields siteId={siteId} />
      <Divider />
      <SiteStructureFields siteId={siteId} />
      <Divider />
      <SiteCodeFields />
    </EntityForm>
  );
}
