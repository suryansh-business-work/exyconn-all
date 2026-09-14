import { Grid } from '@exyconn/shell/components/ui';
import { RhfImageField } from '@exyconn/shell/components/form/rhf';

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

/**
 * The website's home hero.
 *
 * Kept apart from the images above because it is a clip, and because both fields are URLs
 * from Pexels rather than uploads — re-hosting somebody else's stock footage would cost
 * bandwidth to no end. Leave the video empty and the hero stays a still, as it was.
 */
const HERO_FIELDS = [
  {
    name: 'heroVideoUrl',
    label: 'Home hero video',
    helperText: 'A short, quiet clip. Pexels videos are in the picker.',
    media: 'all' as const,
  },
  {
    name: 'heroPosterUrl',
    label: 'Home hero still',
    helperText: 'Shown until the clip plays, and to anyone who asked for less motion.',
    media: 'image' as const,
  },
];

/** Images tab — every branding image uploads through the shared dialog. */
export function BrandingImagesFields() {
  return (
    <Grid container spacing={2}>
      {[...IMAGE_FIELDS, ...HERO_FIELDS].map((field) => (
        <Grid
          key={field.name}
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <RhfImageField
            name={field.name}
            label={field.label}
            helperText={field.helperText}
            folder={UPLOAD_FOLDER}
            media={'media' in field ? field.media : 'image'}
          />
        </Grid>
      ))}
    </Grid>
  );
}
