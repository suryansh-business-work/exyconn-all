import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Flex,
  FormHelperText,
  Text,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@/components/ui';
import { DrawSignature } from './DrawSignature';
import { renderTypedSignature } from './typedSignature';

type Mode = 'draw' | 'type';

export interface SignaturePadProps {
  label: string;
  /** Receives the signature as a PNG data URL, or '' while there is none. */
  onChange: (dataUrl: string) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
}

/**
 * Where somebody signs. They draw with a mouse, finger or stylus — or, for anyone who cannot
 * draw (a keyboard, a screen reader), type their name and have it rendered as their mark.
 * Either way the value is one PNG, so the record reads the same.
 */
export function SignaturePad({
  label,
  onChange,
  helperText,
  error,
  required = false,
}: Readonly<SignaturePadProps>) {
  const t = useT();
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('draw');
  const [typed, setTyped] = useState('');
  const [clearKey, setClearKey] = useState(0);

  const switchTo = (next: Mode | null) => {
    if (!next) {
      return;
    }
    setMode(next);
    setTyped('');
    onChange('');
  };

  const type = (name: string) => {
    setTyped(name);
    onChange(name.trim() ? renderTypedSignature(name, theme.palette.grey[900]) : '');
  };

  const clear = () => {
    setClearKey((key) => key + 1);
    setTyped('');
    onChange('');
  };

  return (
    <Flex direction="column" spacing={1}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Text size="sm" weight="medium">
          {t(label)}
          {required && (
            <Text component="span" color="error.main" aria-hidden>
              {' *'}
            </Text>
          )}
        </Text>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={mode}
          aria-label={t('How to sign')}
          onChange={(_event, next: Mode | null) => switchTo(next)}
        >
          <ToggleButton value="draw">{t('Draw')}</ToggleButton>
          <ToggleButton value="type">{t('Type')}</ToggleButton>
        </ToggleButtonGroup>
      </Flex>
      {mode === 'draw' ? (
        <DrawSignature
          label={t('Signature pad: draw your signature with a mouse, finger or stylus')}
          onChange={onChange}
          clearKey={clearKey}
          invalid={Boolean(error)}
        />
      ) : (
        <TextField
          value={typed}
          onChange={(event) => type(event.target.value)}
          label={t('Type your full name')}
          error={Boolean(error)}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
      )}
      <Flex direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <FormHelperText error={Boolean(error)} sx={{ m: 0 }}>
          {t(error ?? helperText ?? '')}
        </FormHelperText>
        <Button size="small" variant="text" onClick={clear}>
          {t('Clear')}
        </Button>
      </Flex>
    </Flex>
  );
}
