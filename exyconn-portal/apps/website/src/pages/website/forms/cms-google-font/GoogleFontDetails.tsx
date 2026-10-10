import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Slider,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import { googleFontsUrl } from '../../../cms/design-system/font-sources';
import { useDocumentFonts } from '../../../cms/design-system/useDocumentFonts';
import {
  variantLabel,
  type GoogleFontFormValues,
  type GoogleFontRow,
} from './cms-google-font.types';

const DEFAULT_SAMPLE = 'The quick brown fox jumps over the lazy dog';

/** The chosen variants after one checkbox is ticked or cleared. */
const withVariant = (chosen: string[], variant: string, checked: boolean) =>
  checked ? [...chosen, variant] : chosen.filter((v) => v !== variant);

/** The chosen family: which styles to load, and a live sample in each of them. */
export function GoogleFontDetails({ row }: Readonly<{ row: GoogleFontRow | null }>) {
  const t = useT();
  const { control } = useFormContext<GoogleFontFormValues>();
  const variants = useWatch({ control, name: 'variants' });
  const [sample, setSample] = useState(t(DEFAULT_SAMPLE));
  const [size, setSize] = useState(32);
  useDocumentFonts(row ? googleFontsUrl([{ family: row.family, variants: row.variants }]) : '');

  if (!row) {
    return (
      <Text color="text.secondary">
        {t('Pick a family on the left to see it and choose its styles.')}
      </Text>
    );
  }
  return (
    <Box>
      <Text
        weight="semibold"
        size="lg"
        component="div"
        sx={{ fontFamily: `"${row.family}"`, mb: 1 }}
      >
        {row.family}
      </Text>
      <TextField
        size="small"
        fullWidth
        label={t('Preview text')}
        value={sample}
        onChange={(event) => setSample(event.target.value)}
      />
      <Slider
        value={size}
        min={12}
        max={72}
        onChange={(_event, value) => setSize(value as number)}
        aria-label={t('Preview size')}
        valueLabelDisplay="auto"
        sx={{ mt: 1 }}
      />
      <Controller
        control={control}
        name="variants"
        render={({ field, fieldState }) => (
          <FormGroup sx={{ maxHeight: 220, overflowY: 'auto', flexWrap: 'nowrap' }}>
            {row.variants.map((variant) => (
              <Box key={variant}>
                <FormControlLabel
                  label={variantLabel(variant)}
                  control={
                    <Checkbox
                      size="small"
                      checked={field.value.includes(variant)}
                      onChange={(_event, checked) =>
                        field.onChange(withVariant(field.value, variant, checked))
                      }
                    />
                  }
                />
                {variants.includes(variant) && (
                  <Text
                    component="div"
                    sx={{
                      fontFamily: `"${row.family}"`,
                      fontWeight: Number.parseInt(variant, 10),
                      fontStyle: variant.endsWith('i') ? 'italic' : 'normal',
                      fontSize: size,
                      lineHeight: 1.2,
                      pl: 4,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {sample}
                  </Text>
                )}
              </Box>
            ))}
            {fieldState.error && (
              <FormHelperText error>{t(String(fieldState.error.message))}</FormHelperText>
            )}
          </FormGroup>
        )}
      />
    </Box>
  );
}
