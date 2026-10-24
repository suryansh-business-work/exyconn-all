import { useState } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { IconButton, InputAdornment, TextField } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  hint: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  autoFocus?: boolean;
}

interface EyeProps {
  shown: boolean;
  onToggle: () => void;
}

/** The eye at the end of a password field: shows or hides what was typed. */
function PasswordEye({ shown, onToggle }: Readonly<EyeProps>) {
  const t = useT();
  return (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        size="small"
        aria-label={shown ? t('Hide password') : t('Show password')}
        aria-pressed={shown}
        onClick={onToggle}
      >
        {shown ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );
}

/** A labelled text field bound to a string field, with hint and error text. */
export function RhfTextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  type = 'text',
  autoComplete,
  autoFocus = false,
}: Readonly<Props<T>>) {
  const t = useT();
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && shown ? 'text' : type;
  const endAdornment = isPassword ? (
    <PasswordEye shown={shown} onToggle={() => setShown((value) => !value)} />
  ) : undefined;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          fullWidth
          size="small"
          id={name}
          type={inputType}
          label={t(label)}
          name={field.name}
          value={field.value}
          inputRef={field.ref}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          error={fieldState.error !== undefined}
          helperText={t(fieldState.error?.message ?? hint)}
          slotProps={{ input: { endAdornment } }}
        />
      )}
    />
  );
}
