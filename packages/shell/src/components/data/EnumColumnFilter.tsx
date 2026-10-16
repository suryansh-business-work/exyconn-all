import { useCallback } from 'react';
import { useGridFilter, type CustomFilterProps } from 'ag-grid-react';
import { useT } from '@exyconn/i18n';
import { Box, Checkbox, FormControlLabel, FormGroup } from '@/components/ui';
import { enumOptions } from '@/utils/enumOptions';
import type { EnumFilterModel } from './serverGridQuery';

/** The filterParams the column hands this filter: the values the column holds. */
export interface EnumFilterParams {
  options: readonly string[];
}

/** A yes/no column's values read as words, not as `true`/`false`. */
const BOOLEAN_LABELS: Readonly<Record<string, string>> = { true: 'Yes', false: 'No' };

/** How a value reads in the list: Yes/No for a flag, `IN_PROGRESS` as "In Progress". */
export function enumLabel(value: string): string {
  return BOOLEAN_LABELS[value] ?? enumOptions([value])[0].label;
}

/** The next model after ticking or unticking one value; null once none is left. */
export function toggledModel(
  options: readonly string[],
  model: EnumFilterModel | null,
  value: string,
): EnumFilterModel | null {
  const selected = new Set(model?.values ?? []);
  if (selected.has(value)) {
    selected.delete(value);
  } else {
    selected.add(value);
  }
  const values = options.filter((option) => selected.has(option));
  return values.length > 0 ? { filterType: 'enum', values } : null;
}

type EnumColumnFilterProps = CustomFilterProps<unknown, unknown, EnumFilterModel> &
  EnumFilterParams;

/**
 * The filter of an enum or yes/no column: a checkbox per value, a row matching any ticked one.
 * The values come from the server's schema (tableInfo), so the list is never out of date.
 */
export function EnumColumnFilter({
  model,
  onModelChange,
  options,
}: Readonly<EnumColumnFilterProps>) {
  const t = useT();
  const getModelAsString = useCallback(
    (current: EnumFilterModel | null) =>
      (current?.values ?? []).map((value) => t(enumLabel(value))).join(', '),
    [t],
  );
  // The server filters every page, so a row the grid already has always passes.
  useGridFilter({ doesFilterPass: () => true, getModelAsString });
  const selected = new Set(model?.values ?? []);
  return (
    <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
      <FormGroup role="group" aria-label={t('Show rows with')}>
        {options.map((option) => (
          <FormControlLabel
            key={option}
            label={t(enumLabel(option))}
            control={
              <Checkbox
                size="small"
                checked={selected.has(option)}
                onChange={() => onModelChange(toggledModel(options, model, option))}
              />
            }
          />
        ))}
      </FormGroup>
    </Box>
  );
}
