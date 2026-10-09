import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabber } from '@exyconn/tabber';
import { Box, Grid } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useUpdateCmsDesignSystemMutation } from '@exyconn/shell/graphql/generated';
import {
  designSystemSchema,
  toDesignInput,
  toDesignValues,
  type CmsDesignSystemRow,
  type DesignSystemFormValues,
} from './cms-design-system.types';
import { designTabs } from './design-system.tabs';
import { DesignPreview } from './DesignPreview';

interface DesignSystemFormProps {
  design: CmsDesignSystemRow;
  /** Where the tabs live, e.g. /website/s/exyconn/design-system. */
  basePath: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod editor for a site's design system. Names and values follow the
 * server's rules (a name becomes a CSS custom property; a value cannot break out of it).
 */
export function DesignSystemForm({
  design,
  basePath,
  onDone,
  onCancel,
}: Readonly<DesignSystemFormProps>) {
  const [update] = useUpdateCmsDesignSystemMutation();
  const methods = useForm<DesignSystemFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(designSystemSchema),
    defaultValues: toDesignValues(design),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Design system',
    initial: design,
    create: () => Promise.resolve(),
    update: (row, values: DesignSystemFormValues) =>
      update({ variables: { id: row.id, input: toDesignInput(row.siteId, values) } }),
    onDone,
  });

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={isEdit}
      onCancel={onCancel}
      submitLabel="Save design system"
    >
      <RhfTextField name="name" label="Name" />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Tabber
            basePath={basePath}
            items={designTabs(design.siteId)}
            ariaLabel="Design token groups"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ position: { lg: 'sticky' }, top: 80 }}>
            <DesignPreview />
          </Box>
        </Grid>
      </Grid>
    </EntityForm>
  );
}
