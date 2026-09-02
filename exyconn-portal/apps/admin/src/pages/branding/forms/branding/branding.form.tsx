import { useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Tab, Tabs } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useUpdateBrandingMutation } from '@exyconn/shell/graphql/generated';
import { BrandingPreview } from '../../BrandingPreview';
import { BrandingIdentityFields } from './branding-identity.fields';
import { BrandingImagesFields } from './branding-images.fields';
import { BrandingColorsFields } from './branding-colors.fields';
import { BrandingContactFields } from './branding-contact.fields';
import {
  brandingSchema,
  toBrandingValues,
  type BrandingFormValues,
  type BrandingRow,
} from './branding.types';

const TAB_LABELS = ['Identity', 'Images', 'Colors', 'Contact & Social'];

/** Renders the fields for the active tab. Values persist across tab switches. */
function BrandingTabPanel({ tab }: Readonly<{ tab: number }>) {
  if (tab === 0) return <BrandingIdentityFields />;
  if (tab === 1) return <BrandingImagesFields />;
  if (tab === 2) return <BrandingColorsFields />;
  return <BrandingContactFields />;
}

/** Preview fed by the live form values, so edits are visible before saving. */
function BrandingLivePreview() {
  const { control } = useFormContext<BrandingFormValues>();
  const [logoUrl, businessName, slogan, primaryColor] = useWatch({
    control,
    name: ['logoUrl', 'businessName', 'slogan', 'primaryColor'],
  });
  return (
    <BrandingPreview
      logoUrl={logoUrl}
      businessName={businessName}
      slogan={slogan}
      primaryColor={primaryColor}
    />
  );
}

interface BrandingFormProps {
  initial: BrandingRow;
}

/**
 * React Hook Form + Zod form for the organisation's branding settings. The
 * mutation returns the full record, so the Apollo cache refreshes the page.
 */
export function BrandingForm({ initial }: Readonly<BrandingFormProps>) {
  const notify = useNotify();
  const [tab, setTab] = useState(0);
  const [updateBranding] = useUpdateBrandingMutation();
  const methods = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: toBrandingValues(initial),
  });

  const onSubmit = async (values: BrandingFormValues) => {
    try {
      await updateBranding({ variables: { input: values } });
      methods.reset(values);
      notify('Branding updated');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      submitLabel="Save changes"
      onCancel={() => methods.reset(toBrandingValues(initial))}
    >
      <BrandingLivePreview />
      <Box>
        <Tabs value={tab} onChange={(_e, v: number) => setTab(v)} variant="scrollable">
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>
      <BrandingTabPanel tab={tab} />
    </EntityForm>
  );
}
