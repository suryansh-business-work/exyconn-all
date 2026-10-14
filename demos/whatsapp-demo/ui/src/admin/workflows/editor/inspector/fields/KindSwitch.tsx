import { useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';

interface KindSwitchProps {
  /** Path of the whole item whose `kind` this picks, e.g. `actions.0`. */
  name: string;
  /** English source, translated here. */
  label: string;
  /** Each kind with its English label. */
  kinds: Readonly<Record<string, string>>;
  /** A valid item of the new kind, built from the current one (to keep a typed title). */
  starter: (kind: string, current: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Picks the `kind` of a discriminated item (a CTA action, a document section). The kinds
 * have different fields, so a change replaces the whole item with a valid one of that kind.
 */
export function KindSwitch({ name, label, kinds, starter }: Readonly<KindSwitchProps>) {
  const t = useT();
  const { control, getValues, setValue } = useFormContext();
  const kind = useWatch({ control, name: `${name}.kind` }) as string;
  return (
    <TextField
      select
      size="small"
      fullWidth
      label={t(label)}
      value={kind}
      onChange={(event) =>
        setValue(name, starter(event.target.value, getValues(name) ?? {}), { shouldDirty: true })
      }
    >
      {Object.entries(kinds).map(([key, text]) => (
        <MenuItem key={key} value={key}>
          {t(text)}
        </MenuItem>
      ))}
    </TextField>
  );
}
