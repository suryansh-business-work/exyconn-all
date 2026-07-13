import { useWatch } from 'react-hook-form';
import { Box, Flex, Grid } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';

const COLOR_FIELDS = [
  { name: 'primaryColor', label: 'Primary' },
  { name: 'secondaryColor', label: 'Secondary' },
  { name: 'accentColor', label: 'Accent' },
  { name: 'backgroundColor', label: 'Background' },
  { name: 'textColor', label: 'Text' },
] as const;

/** Hex text input with a live swatch of the current value. */
function ColorField({ name, label }: Readonly<{ name: string; label: string }>) {
  const value = useWatch({ name }) as string;
  return (
    <Flex direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          mt: 1,
          flexShrink: 0,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: value,
        }}
      />
      <RhfTextField name={name} label={label} helperText="6-digit hex, e.g. #155dfc" />
    </Flex>
  );
}

/** Colors tab — the palette applied across the portal, website and apps. */
export function BrandingColorsFields() {
  return (
    <Grid container spacing={2.5}>
      {COLOR_FIELDS.map((field) => (
        <Grid item xs={12} sm={6} key={field.name}>
          <ColorField name={field.name} label={field.label} />
        </Grid>
      ))}
    </Grid>
  );
}
