import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabber, type TabberItem } from '@exyconn/tabber';
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

/** Route the branding tabs live under; each group of fields is a slug beneath it. */
const BRANDING_PATH = '/admin/branding';

/**
 * One tab per group of fields. All groups share the one form, so values entered
 * on a tab survive switching away and back — only the visible fields change.
 */
const TABS: TabberItem[] = [
  { slug: 'identity', label: 'Identity', content: <BrandingIdentityFields /> },
  { slug: 'images', label: 'Images', content: <BrandingImagesFields /> },
  { slug: 'colors', label: 'Colors', content: <BrandingColorsFields /> },
  { slug: 'contact', label: 'Contact & Social', content: <BrandingContactFields /> },
];

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
      <Tabber
        basePath={BRANDING_PATH}
        items={TABS}
        variant="scrollable"
        ariaLabel="Branding settings"
      />
    </EntityForm>
  );
}
