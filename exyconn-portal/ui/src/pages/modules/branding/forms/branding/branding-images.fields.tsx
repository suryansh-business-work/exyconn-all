import { Grid } from '@/components/ui';
import { RhfImageField } from '@/components/form/rhf';

const UPLOAD_FOLDER = 'branding';

/** Each branding image, with the field name it binds to and its hint. */
const IMAGE_FIELDS = [
  { name: 'logoUrl', label: 'Logo', helperText: 'Primary logo, used on light surfaces.' },
  { name: 'logoDarkUrl', label: 'Logo (dark)', helperText: 'Variant for dark backgrounds.' },
  { name: 'faviconUrl', label: 'Favicon', helperText: 'Square, 32×32 or larger.' },
  { name: 'appIconUrl', label: 'App icon', helperText: 'Square, 512×512 for stores.' },
  { name: 'emailLogoUrl', label: 'Email logo', helperText: 'Shown at the top of emails.' },
  { name: 'ogImageUrl', label: 'Social share image', helperText: '1200×630 for link previews.' },
] as const;

/** Images tab — every branding image uploads through the shared dialog. */
export function BrandingImagesFields() {
  return (
    <Grid container spacing={2.5}>
      {IMAGE_FIELDS.map((field) => (
        <Grid item xs={12} sm={6} md={4} key={field.name}>
          <RhfImageField
            name={field.name}
            label={field.label}
            helperText={field.helperText}
            folder={UPLOAD_FOLDER}
          />
        </Grid>
      ))}
    </Grid>
  );
}
