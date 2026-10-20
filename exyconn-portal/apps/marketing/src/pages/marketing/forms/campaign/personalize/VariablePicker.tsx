import { useId } from 'react';
import { useT } from '@exyconn/i18n';
import { Autocomplete, Box, Text, TextField } from '@exyconn/shell/components/ui';
import type { StudioOptions } from '../studio/useStudioOptions';

type Variable = StudioOptions['variables'][number];

/** How each group reads in the picker. */
const GROUP_LABELS: Readonly<Record<string, string>> = {
  CONTACT: 'Contact',
  COMPANY: 'Company',
  CAMPAIGN: 'Campaign',
  SYSTEM: 'System',
  LINKS: 'Links',
};

interface VariablePickerProps {
  variables: readonly Variable[];
  /** Told the placeholder to insert, e.g. `{{contact.firstName|there}}`. */
  onInsert: (placeholder: string) => void;
  label?: string;
  disabled?: boolean;
}

/** Placeholders get a fallback where an empty value would read badly. */
const placeholderFor = (variable: Variable) =>
  variable.group === 'CONTACT' && variable.key.endsWith('Name')
    ? `{{${variable.key}|there}}`
    : `{{${variable.key}}}`;

/** One option: its name, key, what it is, and an example of what it renders. */
function VariableOption({ variable }: Readonly<{ variable: Variable }>) {
  const t = useT();
  return (
    <Box>
      <Text size="sm" weight="medium" sx={{ display: 'block' }}>
        {t(variable.label)}{' '}
        <Text size="caption" color="text.secondary">{`{{${variable.key}}}`}</Text>
      </Text>
      <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
        {t(variable.description)} {t('e.g. {example}', { example: variable.example })}
      </Text>
    </Box>
  );
}

/**
 * A searchable list of every variable, grouped Contact / Company / Campaign / System / Links.
 * Picking one inserts it where the cursor was; the field keeps focus afterwards.
 */
export function VariablePicker({
  variables,
  onInsert,
  label = 'Insert variable',
  disabled,
}: Readonly<VariablePickerProps>) {
  const t = useT();
  const id = useId();
  return (
    <Autocomplete
      id={id}
      size="small"
      disabled={disabled}
      options={[...variables]}
      groupBy={(variable) => t(GROUP_LABELS[variable.group] ?? variable.group)}
      getOptionLabel={(variable) => t(variable.label)}
      filterOptions={(options, state) => {
        const query = state.inputValue.trim().toLowerCase();
        return options.filter((variable) =>
          [variable.key, t(variable.label), t(variable.description)].some((text) =>
            text.toLowerCase().includes(query),
          ),
        );
      }}
      value={null}
      blurOnSelect
      onChange={(_event, variable) => variable && onInsert(placeholderFor(variable))}
      renderOption={({ key, ...props }, variable) => (
        <li key={key} {...props}>
          <VariableOption variable={variable} />
        </li>
      )}
      renderInput={(params) => (
        <TextField {...params} label={t(label)} placeholder={t('Search variables…')} />
      )}
      sx={{ minWidth: 260 }}
    />
  );
}
