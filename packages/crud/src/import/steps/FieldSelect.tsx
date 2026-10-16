import { useT } from '@exyconn/i18n';
import { ListSubheader, MenuItem, TextField } from '@exyconn/shell/components/ui';
import type { ImportFieldOption } from '../import.types';

/** The select's value for "Don't import"; MUI needs a string. */
const SKIP = '';

interface FieldSelectProps {
  column: string;
  value: string | null;
  fields: readonly ImportFieldOption[];
  onChange: (key: string | null) => void;
}

function optionText(field: ImportFieldOption): string {
  const label = field.required ? `${field.label} *` : field.label;
  return field.typeLabel ? `${label} (${field.typeLabel})` : label;
}

/** The fields under each group heading, in the order the groups first appear. */
function grouped(fields: readonly ImportFieldOption[]): [string, ImportFieldOption[]][] {
  const groups = new Map<string, ImportFieldOption[]>();
  for (const field of fields) {
    const group = field.group ?? '';
    groups.set(group, [...(groups.get(group) ?? []), field]);
  }
  return [...groups.entries()];
}

/** The "Import as" choice for one file column; required fields are marked with an asterisk. */
export function FieldSelect({ column, value, fields, onChange }: Readonly<FieldSelectProps>) {
  const t = useT();
  const items = grouped(fields).flatMap(([group, members]) => [
    ...(group ? [<ListSubheader key={`group-${group}`}>{group}</ListSubheader>] : []),
    ...members.map((field) => (
      <MenuItem key={field.key} value={field.key}>
        {optionText(field)}
      </MenuItem>
    )),
  ]);
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={t('Import {column} as', { column })}
      value={value ?? SKIP}
      onChange={(event) => onChange(event.target.value === SKIP ? null : event.target.value)}
    >
      <MenuItem value={SKIP}>
        <em>{t("Don't import")}</em>
      </MenuItem>
      {items}
    </TextField>
  );
}
