import type { ReactElement } from 'react';
import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@exyconn/ui';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface Props {
  value: string;
  disabled: boolean;
  error: boolean;
  /** Omitted when there is nothing to say — no blank row is reserved under the field. */
  helperText?: string;
  onChange: (value: string) => void;
}

/** Password input with an eye toggle. Visibility is local — nothing leaves this component. */
export default function PasswordField({
  value,
  disabled,
  error,
  helperText,
  onChange,
}: Readonly<Props>): ReactElement {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <TextField
      label="Password"
      type={visible ? 'text' : 'password'}
      autoComplete="current-password"
      fullWidth
      value={value}
      disabled={disabled}
      error={error}
      helperText={helperText}
      onChange={(event) => onChange(event.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={label}
              edge="end"
              size="small"
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
