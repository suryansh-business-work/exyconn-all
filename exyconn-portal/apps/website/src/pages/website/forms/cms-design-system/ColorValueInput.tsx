import { HEX_COLOR } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { TextField } from '@exyconn/shell/components/ui';

interface ColorValueInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

/**
 * The browser's colour picker beside a colour token. It can only show a hex colour; a value
 * written in CSS (color-mix(), oklch(), var()) is still edited as text, and picking replaces it.
 */
export function ColorValueInput({ value, onChange, label }: Readonly<ColorValueInputProps>) {
  const t = useT();
  const hex = HEX_COLOR.test(value.trim()) ? value.trim() : '';
  return (
    <TextField
      type="color"
      size="small"
      value={hex || '#000000'}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{ htmlInput: { 'aria-label': t('Pick {label}', { label }) } }}
      sx={{ width: 64, flexShrink: 0, opacity: hex ? 1 : 0.5 }}
    />
  );
}
