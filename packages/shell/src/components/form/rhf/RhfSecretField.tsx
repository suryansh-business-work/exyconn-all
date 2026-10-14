import { useState, type ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useT } from '@exyconn/i18n';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from '@/components/ui';
import { errorMessage } from '@/utils/errorMessage';
import { useFieldCopy } from './useFieldCopy';

interface RhfSecretFieldProps {
  name: string;
  label: string;
  /** A hint under the field; replaced by the saved-key hint while a revealable key is hidden. */
  helperText?: ReactNode;
  /** Whether a value is already saved on the server, so the empty field is not empty there. */
  stored?: boolean;
  /** Fetches the saved value for the eye button. Without it the eye only shows what was typed. */
  onReveal?: () => Promise<string>;
  /**
   * Tries the key (typed, else saved) against its provider and resolves to what worked; a
   * Test button appears beside the eye. A rejection's message says what did not.
   */
  onTest?: () => Promise<string>;
}

/** The Test button: runs the check and reports the outcome either way. */
function TestKeyButton({
  label,
  onTest,
}: Readonly<{ label: string; onTest: () => Promise<string> }>) {
  const t = useT();
  const notify = useNotify();
  const [testing, setTesting] = useState(false);
  const run = async () => {
    setTesting(true);
    try {
      notify(await onTest(), 'success');
    } catch (error) {
      notify(errorMessage(error, t('The {label} test failed', { label: t(label) })), 'error');
    } finally {
      setTesting(false);
    }
  };
  return (
    <Button
      size="small"
      onClick={() => {
        run().catch(() => setTesting(false));
      }}
      disabled={testing}
      aria-label={t('Test the {label}', { label: t(label) })}
      startIcon={testing ? <CircularProgress size={14} /> : undefined}
      sx={{ mr: 0.5, minWidth: 0 }}
    >
      {t('Test')}
    </Button>
  );
}

const SAVED_HINT = 'Saved. Use the eye to see it, or type a new one to replace it.';

/**
 * A password-style field with an eye button, and optionally a Test button. On an edit form the
 * saved key is not sent to the page; the eye asks for it (`onReveal`), fills the field and shows
 * it. Leaving the field empty still keeps what is saved.
 */
export function RhfSecretField({
  name,
  label,
  helperText,
  stored = false,
  onReveal,
  onTest,
}: Readonly<RhfSecretFieldProps>) {
  const t = useT();
  const copy = useFieldCopy();
  const notify = useNotify();
  const { control, setValue, getValues } = useFormContext();
  const [visible, setVisible] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const toggle = async () => {
    if (visible) {
      setVisible(false);
      return;
    }
    if (stored && onReveal && !getValues(name)) {
      setRevealing(true);
      try {
        setValue(name, await onReveal(), { shouldDirty: false });
      } catch {
        notify('Could not load the saved {label}', 'error', { label: t(label) });
        return;
      } finally {
        setRevealing(false);
      }
    }
    setVisible(true);
  };

  const toggleLabel = visible
    ? t('Hide {label}', { label: t(label) })
    : t('Show {label}', { label: t(label) });
  const toggleIcon = visible ? (
    <VisibilityOffIcon fontSize="small" />
  ) : (
    <VisibilityIcon fontSize="small" />
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const hiddenSaved = stored && !field.value;
        // Only an eye that can fetch the saved key may say so; otherwise the caller's hint stands.
        const hint = hiddenSaved && onReveal ? SAVED_HINT : helperText;
        return (
          <TextField
            {...field}
            value={field.value ?? ''}
            type={visible ? 'text' : 'password'}
            label={copy(label)}
            placeholder={hiddenSaved ? '••••••••••••' : undefined}
            fullWidth
            autoComplete="off"
            error={Boolean(fieldState.error)}
            helperText={copy(fieldState.error?.message ?? hint)}
            slotProps={{
              inputLabel: hiddenSaved ? { shrink: true } : undefined,
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {onTest && <TestKeyButton label={label} onTest={onTest} />}
                    <Tooltip title={toggleLabel}>
                      <span>
                        <IconButton
                          size="small"
                          edge="end"
                          aria-label={toggleLabel}
                          aria-pressed={visible}
                          disabled={revealing}
                          onClick={() => {
                            toggle().catch(() => setRevealing(false));
                          }}
                        >
                          {revealing ? <CircularProgress size={18} /> : toggleIcon}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
        );
      }}
    />
  );
}
