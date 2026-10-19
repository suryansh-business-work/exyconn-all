import { useState } from 'react';
import { HEX_COLOR } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import {
  borderWidth,
  Box,
  color,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@exyconn/ui';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

/** Fixed neutrals every image can sit on, from the design-system ramps. */
const NEUTRAL_SWATCHES = [
  { label: 'White', value: color.white },
  { label: 'Off-white', value: color.neutral[50] },
  { label: 'Light grey', value: color.neutral[100] },
  { label: 'Grey', value: color.zinc[400] },
  { label: 'Charcoal', value: color.neutral[700] },
  { label: 'Black', value: color.black },
] as const;

const SWATCH_SIZE = 28;

/**
 * Preset swatches (the neutrals plus the theme's brand colour), a hex field checked against
 * the shared pattern, and the browser's own colour picker — all editing one `#rrggbb` value.
 */
export function ColorPicker({ value, onChange }: Readonly<ColorPickerProps>) {
  const t = useT();
  const theme = useTheme();
  const swatches = [...NEUTRAL_SWATCHES, { label: 'Brand', value: theme.palette.primary.main }];
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  // A swatch or the native picker changed the value: the hex field follows it.
  if (shown !== value) {
    setShown(value);
    setDraft(value);
  }
  const draftValid = HEX_COLOR.test(draft);

  const handleDraft = (next: string) => {
    setDraft(next);
    if (HEX_COLOR.test(next)) {
      onChange(next.toLowerCase());
    }
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_event, next: string | null) => next && onChange(next)}
        aria-label={t('Background colour')}
        sx={{ flexWrap: 'wrap', gap: 0.5 }}
      >
        {swatches.map((swatch) => (
          <ToggleButton
            key={swatch.label}
            value={swatch.value}
            aria-label={t(swatch.label)}
            title={t(swatch.label)}
            sx={{ p: 0.5 }}
          >
            <Box
              aria-hidden
              sx={{
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                borderRadius: 0.5,
                border: `${borderWidth.hairline}px solid`,
                borderColor: 'divider',
                bgcolor: swatch.value,
              }}
            />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label={t('Hex colour')}
          value={draft}
          onChange={(event) => handleDraft(event.target.value)}
          error={!draftValid}
          helperText={draftValid ? t('e.g. #ffffff') : t('Use # and six hex digits, e.g. #ffffff')}
          sx={{ width: 200 }}
        />
        <TextField
          type="color"
          size="small"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          slotProps={{ htmlInput: { 'aria-label': t('Pick a custom colour') } }}
          sx={{ width: 64 }}
        />
      </Stack>
    </Stack>
  );
}
