import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Box, Chip, Flex, Grid, Text } from '@exyconn/shell/components/ui';
import { RhfImageField, RhfTextField } from '@exyconn/shell/components/form/rhf';
import type { BrandingFormValues } from './branding.types';

const UPLOAD_FOLDER = 'branding/login';

interface LoginPageCardProps {
  index: number;
  app: string;
}

/**
 * One portal's login screen. Every portal signs in through the same form, so only the
 * name, the strapline, the artwork and the accent are editable here.
 */
function LoginPageCard({ index, app }: Readonly<LoginPageCardProps>) {
  const accent = useWatch<BrandingFormValues>({
    name: `loginPages.${index}.accentColor`,
  }) as string;

  return (
    <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Box
          aria-hidden
          sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: accent }}
        />
        <Chip label={app} />
      </Flex>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={4}>
          <RhfImageField
            editableUrl
            name={`loginPages.${index}.backgroundImageUrl`}
            label="Background"
            folder={UPLOAD_FOLDER}
            helperText="Paste a hosted image URL, or upload one."
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Flex direction="column" spacing={1.5}>
            <RhfTextField
              name={`loginPages.${index}.name`}
              label="Portal name"
              helperText="Shown above the sign-in form on this portal's domain."
            />
            <RhfTextField
              name={`loginPages.${index}.tagline`}
              label="Tagline"
              helperText="One short line under the portal name."
            />
            <RhfTextField
              name={`loginPages.${index}.accentColor`}
              label="Accent colour"
              helperText="6-digit hex — tints the overlay and the log-in button."
            />
          </Flex>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Login Pages tab — one card per portal app. The list comes from the API, which fills it
 * from the app registry, so a newly added portal shows up here without a migration.
 */
export function BrandingLoginPagesFields() {
  const { control } = useFormContext<BrandingFormValues>();
  const { fields } = useFieldArray({ control, name: 'loginPages' });

  return (
    <Flex direction="column" spacing={1.5}>
      <Text size="sm" color="text.secondary">
        Every portal shares one sign-in, on its own subdomain. These settings give each one its own
        front door.
      </Text>
      {fields.map((field, index) => (
        <LoginPageCard key={field.id} index={index} app={field.app} />
      ))}
    </Flex>
  );
}
