import { useT } from '@exyconn/i18n';
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@exyconn/ui';
import { ColorPicker } from './ColorPicker';
import type { BackgroundMode } from './crop-options';

interface BackgroundPickerProps {
  mode: BackgroundMode;
  color: string;
  allowTransparent: boolean;
  onModeChange: (mode: BackgroundMode) => void;
  onColorChange: (hex: string) => void;
}

const MODES: ReadonlyArray<{ value: BackgroundMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'blur', label: 'Blur' },
  { value: 'color', label: 'Colour' },
  { value: 'transparent', label: 'Transparent' },
];

/**
 * What fills the frame around a zoomed-out image: its own edge colour (Auto), a blurred copy
 * of it, a picked colour, or nothing at all (a transparent PNG).
 */
export function BackgroundPicker({
  mode,
  color,
  allowTransparent,
  onModeChange,
  onColorChange,
}: Readonly<BackgroundPickerProps>) {
  const t = useT();
  const modes = allowTransparent ? MODES : MODES.filter((item) => item.value !== 'transparent');

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('Background')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_event, next: BackgroundMode | null) => next && onModeChange(next)}
          aria-label={t('Background')}
          sx={{ flexWrap: 'wrap' }}
        >
          {modes.map((item) => (
            <ToggleButton key={item.value} value={item.value}>
              {t(item.label)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      {mode === 'color' && <ColorPicker value={color} onChange={onColorChange} />}
    </Stack>
  );
}
