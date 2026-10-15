import { useT } from '@exyconn/i18n';
import { ListSubheader, MenuItem, TextField } from '@exyconn/shell/components/ui';
import type { CrmPropertyInfo } from '../../schema';
import { PROPERTY_TYPE_LABEL, propertyLabel, type Translate } from '../../propertyText';

/** What a value of each type looks like in a file, as the select names it. */
/** The select's value for "Don't import"; MUI needs a string. */
const SKIP = '';

interface PropertySelectProps {
  column: string;
  value: string | null;
  properties: readonly CrmPropertyInfo[];
  onChange: (key: string | null) => void;
}

function optionItems(t: Translate, heading: string, properties: readonly CrmPropertyInfo[]) {
  if (properties.length === 0) {
    return [];
  }
  return [
    <ListSubheader key={`group-${heading}`}>{t(heading)}</ListSubheader>,
    ...properties.map((property) => (
      <MenuItem key={property.key} value={property.key}>
        {t('{label} ({type})', {
          label: propertyLabel(t, property),
          type: t(PROPERTY_TYPE_LABEL[property.type]),
        })}
      </MenuItem>
    )),
  ];
}

/** The "Import as" choice for one CSV column: a property, grouped built-in then custom. */
export function PropertySelect({
  column,
  value,
  properties,
  onChange,
}: Readonly<PropertySelectProps>) {
  const t = useT();
  const builtIn = properties.filter((property) => property.builtIn);
  const custom = properties.filter((property) => !property.builtIn);
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
      {optionItems(t, 'Built-in', builtIn)}
      {optionItems(t, 'Custom', custom)}
    </TextField>
  );
}
